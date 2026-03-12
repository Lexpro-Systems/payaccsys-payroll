/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW LOAN PANEL
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
app.panel.ViewLoans = function(config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;

    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var cancelLoanBtn = null;
    var downloadBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var personalDetailsHeadingEl = null;
    var personalDetailsEditBtn = null;
    var personalDetailsSectionEl = null;
    var employeeNameDisplay = null;
    var descriptionDisplay = null;
    var amountDisplay = null;
    var outstandingAmountDisplay = null;
    var instalmentAmountDisplay = null;
    var interestTypeDisplay = null;
    var totalPaymentsDisplay = null;
    var outstandingPaymentsDisplay = null;
    var interestRateDisplay = null;
    var startDateDisplay = null;
    var fullyPaidOnDisplay = null;
    var capitalizationPeriodDisplay = null;
    var capitalizationDayDisplay = null;
    var loanStatusDisplay = null;
    var adjustAmountDisplay = null;
    var calculateTaxableBenefitDisplay = null;
    
    var paymentsGrid = null;
    
    var refreshLoans = false;
    var loanStatusCode = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadLoan() {
        loader.show( false );
        lx.sendJSON({
            url: 'exec.php?c=Loan&fn=get',
            data: {
                loanId: config.loanId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
                
                employeeNameDisplay.setValue(response.loan.alias + ' ' + response.loan.lastName);
                descriptionDisplay.setValue(response.loan.description);
                interestTypeDisplay.setValue(response.loan.loanInterestTypeName);
                totalPaymentsDisplay.setValue(response.loan.totalPayments);
                outstandingPaymentsDisplay.setValue(response.loan.outstandingPayments);
                
                let interestRate = parseFloat(response.loan.interestRate);
                interestRate = interestRate.toFixed(2);
                interestRate = interestRate + '%';
                if (response.loan.interestRate === null) {
                    interestRate = '';
                }
                interestRateDisplay.setValue(interestRate);
                
                amountDisplay.setValue( !isNaN(response.loan.principalAmount) ? lx.util.formatCurrency(response.loan.principalAmount) : '-' );
                outstandingAmountDisplay.setValue( !isNaN(response.loan.outstandingAmount) ? lx.util.formatCurrency(response.loan.outstandingAmount) : '-' );
                instalmentAmountDisplay.setValue( !isNaN(response.loan.instalmentAmount) ? lx.util.formatCurrency(response.loan.instalmentAmount) : '-' );
                startDateDisplay.setValue(response.loan.startDate);
                fullyPaidOnDisplay.setValue( response.loan.fullyPaidOn != null ? response.loan.fullyPaidOn : '-' );
                capitalizationPeriodDisplay.setValue(response.loan.loanCapitalizationPeriodTypeName);
                capitalizationDayDisplay.setValue( response.loan.capitalizationDay != null ? response.loan.capitalizationDay : '-' );
                loanStatusDisplay.setValue(response.loan.loanStatusName);
                
                loanStatusCode = response.loan.loanStatusCode;
                if( loanStatusCode === 'ACTI' ) {
                    cancelLoanBtn.setLabel( 'Cancel Loan' );
                    cancelLoanBtn.enable();
                }
                else if( loanStatusCode === 'CANC' ) {
                    cancelLoanBtn.setLabel( 'Reactivate Loan' );
                    cancelLoanBtn.enable();
                }
                else {
                    // cancelLoanBtn.setLabel( '' );
                    cancelLoanBtn.disable();
                }
                
                let adjust = 'No';
                if( response.loan.adjustLoanAmount ) {
                    adjust = 'Yes';
                }
                adjustAmountDisplay.setValue(adjust);
                
                let calculateTaxableBenefit = 'No';
                if( response.loan.calculateTaxableBenefit ) {
                    calculateTaxableBenefit = 'Yes';
                }
                calculateTaxableBenefitDisplay.setValue( calculateTaxableBenefit );
                
                let totalAmount = parseFloat(response.loan.principalAmount);
                
                // Populate grid
                var payments = [];
                for( var i = 0; i < response.loan.payments.length; i++ ) {
                    let interestRate = parseFloat(response.loan.payments[i].interestRate);
                    interestRate = interestRate.toFixed(2);
                    interestRate = interestRate + '%';
                    if (response.loan.payments[i].interestRate === null) {
                        interestRate = '';
                    }
                    
                    let interestAmount = parseFloat(response.loan.payments[i].interestAmount);
                    let paidAmount = parseFloat(response.loan.payments[i].paidAmount);
                    totalAmount = totalAmount - paidAmount + interestAmount;
                    
                    payments.push({
                        id: response.loan.payments[i].id,
                        paidOn: response.loan.payments[i].paidOn,
                        paidAmount: lx.util.formatCurrency(response.loan.payments[i].paidAmount),
                        interestAmount: lx.util.formatCurrency(response.loan.payments[i].interestAmount),
                        interestRate: interestRate,
                        balance: lx.util.formatCurrency(totalAmount),
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                paymentsGrid.clear();
                paymentsGrid.addRows( payments );
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
            
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onUpdate') ) me.addEventListener('update', compConfig.onUpdate);
        
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
            innerHTML: 'Loan: ' + compConfig.loanDescription
        });
        
        cancelLoanBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Cancel Loan',
            height: '32px',
            width: '160px',
            margin: '0px 20px 0px auto',
            
            onClick: cancelLoanBtnClickEventHandler
        });
        cancelLoanBtn.disable();
        
        downloadBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Download Agreement',
            height: '32px',
            width: '160px',
            margin: '0px 20px 0px 0px',
            
            onClick: downloadBtnClickEventHandler
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
        // PERSONAL DETAILS SECTION
        //
        
        // Create the personalDetailsHeadingEl element
        personalDetailsHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Loan Details</div>'
        });
        
        // Create personalDetailsEditBtn component
        personalDetailsEditBtn = new lx.component.Button({
            renderTo: personalDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: loanEditBtnClickEventhandler
        });
        
        // Create the personalDetailsSectionEl element
        personalDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        employeeNameDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Employee Name:',
            labelWidth: '230px'
        });
        
        descriptionDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Description:',
            labelWidth: '230px'
        });
        
        amountDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Amount:',
            labelWidth: '230px'
        });
        
        outstandingAmountDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Outstanding Amount:',
            labelWidth: '230px'
        });
        
        interestTypeDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Interest Type:',
            labelWidth: '230px'
        });
        
        interestRateDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Interest Rate:',
            labelWidth: '230px'
        });
        
        startDateDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Start Date:',
            labelWidth: '230px'
        });
        
        totalPaymentsDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Total Instalments:',
            labelWidth: '230px'
        });
        
        outstandingPaymentsDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Instalments Outstanding:',
            labelWidth: '230px'
        });
        
        instalmentAmountDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Instalment Amount:',
            labelWidth: '230px'
        });
        
        capitalizationPeriodDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Capitalization Period:',
            labelWidth: '230px'
        });
        
        capitalizationDayDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Capitalization Day:',
            labelWidth: '230px'
        });
        
        adjustAmountDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Adjust Amount:',
            labelWidth: '230px'
        });
        
        calculateTaxableBenefitDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Calculate Taxable Benefit:',
            labelWidth: '230px'
        });
        
        fullyPaidOnDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Fully Paid On:',
            labelWidth: '230px'
        });
        
        loanStatusDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Loan Status:',
            labelWidth: '230px'
        });
        
        
        //
        // PAYMENTS SECTION
        //
        
        // Create the taxHeadingEl element
        // let paymentsHeadingEl = 
        new lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 5px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Payments</div>'
        });
        
        /*
        new lx.component.Button({
            renderTo: paymentsHeadingEl,
            label: 'Add',
            style: 'text',
            
            onClick: addLoanPaymentBtnClickEventhandler
        });
        */
        
        // Create UIF contact section element
        let paymentSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                // padding: '15px',
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // // Create paymentsGridMenuOptions array
        // var paymentsGridMenuOptions = [
        //     {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'},
        // ];
        
        // Create paymentsGrid component
        paymentsGrid = new lx.component.Grid({
            renderTo: paymentSectionEl,
            width: '100%',
            autoSize: true,
            // height: '200px',
            
            columns: [
                {dataIndex: 'paidOn', name: 'Payment Date', padding: '0px 0px 0px 20px'},
                {dataIndex: 'paidAmount', name: 'Paid Amount',  width: '150px', alignment: 'right'},
                {dataIndex: 'interestAmount', name: 'Interest Amount',  width: '150px', alignment: 'right'},
                {dataIndex: 'interestRate', name: 'Interest Rate', width: '110px', padding: '0px 0px 0px 20px', alignment: 'right'},
                {dataIndex: 'balance', name: 'Balance', width: '110px', padding: '0px 0px 0px 20px', alignment: 'right'},
                // {dataIndex: 'menu', name: '', type: 'menu', options: paymentsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 20px 0px 0px'}
            ],
            
            // onCellClick: paymentsGridCellClickEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if(clickEvent.value === 'remove'){
                    new lx.component.Messagebox({
                        message: 
                            'Are you sure you want to remove this payment?' ,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the department be removed?
                            if( closeEvent.button === 'remove' ) {
                                // Delete the department
                                lx.sendJSON({
                                    url: 'exec.php?c=Loan&fn=removePayment',
                                    data: {
                                        paymentId: parseInt(paymentsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Payment Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        paymentsGrid.removeRow(clickEvent.rowIndex);
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
        
        // Load form data
        loadLoan();
        
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
        me.fireEvent('destroy', {srcPanel: me, refreshLoans: refreshLoans});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // addLoanPaymentBtn Click Event Handler
    /*
    function addLoanPaymentBtnClickEventhandler() {
        // Create a modal window
        var addLoanPaymentModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '450px'
        });
        
        // Create the addLoanPaymentPanel panel
        var addLoanPaymentPanel = new app.panel.AddLoanPayment({
            renderTo: addLoanPaymentModal.getContainer(),
            show: true,
            
            loanId: config.loanId,
            outstandingAmount: outstandingAmountDisplay.getValue(),
            instalmentAmount: instalmentAmountDisplay.getValue(),
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                loadLoan(true);
                refreshLoans = true;
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addLoanPaymentModal.addEventListener('destroy', function() {
            addLoanPaymentPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addLoanPaymentModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addLoanPaymentModal.show();
        addLoanPaymentPanel.focus();
    }
    */
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    
    // cancelLoanBtn click event handler
    function cancelLoanBtnClickEventHandler() {
        // Set the updated status
        let message = 'If you select continue the loan will be reactivated and future instalments will be added to the payslips of the employee. Are you certain you wish to continue?';
        let updatedStatusCode = 'ACTI';
        if( loanStatusCode === 'ACTI' ) {
            message = 'If you select continue the loan will be canceled and no further instalments will be added to the payslips of the employee. Are you certain you wish to continue?';
            updatedStatusCode = 'CANC';
        }
        
        // if( updatedStatusCode === 'CANC' ) {
            new lx.component.Messagebox({
                title: '<i class="fa fa-exclamation-triangle" style="color:#E75B54; margin: 0px 10px 0px 0px;"></i>' + (updatedStatusCode === 'ACTI' ? 'Reactivate' : 'Cancel' ) + ' Loan',
                message: message,
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        // Update the loan status
                        lx.sendJSON({
                            url: 'exec.php?c=Loan&fn=update',
                            data: {
                                loanId: config.loanId,
                                loanStatusCode: updatedStatusCode
                            },
                            onSuccess: function( responseText ) {
                                // Hide the loader and reanable the button
                                cancelLoanBtn.hideLoader();
                                cancelLoanBtn.enable();
                                
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    cancelLoanBtn.showWarning(response.error);
                                    return; 
                                }
                                
                                loadLoan(true);
                                refreshLoans = true;
                            }
                        });
                    }
                }
            });
        // }
        // else {
        //     // Update the loan status
        //     lx.sendJSON({
        //         url: 'exec.php?c=Loan&fn=update',
        //         data: {
        //             loanId: config.loanId,
        //             loanStatusCode: updatedStatusCode
        //         },
        //         onSuccess: function( responseText ) {
        //             // Hide the loader and reanable the button
        //             cancelLoanBtn.hideLoader();
        //             cancelLoanBtn.enable();
                    
        //             var response = JSON.parse(responseText);
                    
        //             if( response.ok !== true ) {
        //                 cancelLoanBtn.showWarning(response.error);
        //                 return; 
        //             }
                    
        //             loadLoan(true);
        //             refreshLoans = true;
        //         }
        //     });
        // }
    }
    
    // downloadBtn click event handler
    function downloadBtnClickEventHandler() {
        lx.sendForm({
            url: 'exec.php?c=Loan&fn=downloadAgreement',
            target: '_blank',
            data: {
                loanId: config.loanId
            }
        });
    }
    
    // personalDetailsEditBtn click event handler
    function loanEditBtnClickEventhandler() {
        
        // Create a modal window
        var editLoanModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '276px'
        });
        
        // Create the editLoanPanel panel
        var editLoanPanel = new app.panel.EditLoan({
            renderTo: editLoanModal.getContainer(),
            show: true,
            
            loanId: config.loanId,
            employeeId: config.employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadLoan( true );
                refreshLoans = true;
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editLoanModal.addEventListener('destroy', function() {
            editLoanPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editLoanModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editLoanModal.show();
        editLoanPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //

    me.init( config );
};