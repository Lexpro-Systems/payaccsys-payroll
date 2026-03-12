/* globals app, lx */
'use strict';

// EDIT LOAN PANEL
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
app.panel.EditLoan = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var loanDetailsSectionEl = null;
    
    var employeeSelect = null;
    var descriptionTxt = null;
    var calculateTaxableBenefitCb = null;
    // var statusContainerEl = null;
    // var statusRadio = null;
    // var loanInterestTypeSelect = null;
    // var loanCapitalizationPeriodTypeSelect = null;
    // var interestRateTxt = null;
    // var amountTxt = null;
    // var totalPaymentsTxt = null;
    // var instalmentsTxt = null;
    // var startDate = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var editBtnContainerEl = null;
    var editBtn = null;
    
    // var formChanged = false;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load employees
    function loadEmployees( srcSelect ) {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: srcSelect.getSearchString(),
                limit: 20,
                offset: srcSelect.getItemCount(),
                sortList: [
                    {'dataIndex': 'name', 'order': 'ASC'}
                ]
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }
                
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    employees.push({
                        value: response.employees[i].id,
                        text: response.employees[i].alias
                    });
                }
                
                srcSelect.addItems( employees );
            }
        });
    }
    
    
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
                
                descriptionTxt.setValue(response.loan.description);
                // if( response.loan.loanStatusCode !== 'ACTI' && response.loan.loanStatusCode !== 'CANC' ) {
                //     statusContainerEl.style.display = 'none';
                //     statusRadio.addItems([
                //         { text: response.loan.loanStatusName, value: response.loan.loanStatusCode }
                //     ]);
                //     statusRadio.disable();
                // } else {
                //     statusContainerEl.style.display = 'block';
                //     statusRadio.addItems([
                //         { text: 'Active',   value: 'ACTI' },
                //         { text: 'Canceled', value: 'CANC' }
                //     ]);
                // }
                // statusRadio.setValue(response.loan.loanStatusCode);
                
                // loanInterestTypeSelect.setValue(response.loan.loanInterestTypeCode, response.loan.loanInterestTypeName);
                // interestRateTxt.setValue(response.loan.interestRate);
                // amountTxt.setValue(response.loan.principalAmount);
                // startDate.setValue(response.loan.startDate);
                // totalPaymentsTxt.setValue(response.loan.totalPayments);
                // loanCapitalizationPeriodTypeSelect.setValue(response.loan.loanCapitalizationPeriodTypeCode, response.loan.loanCapitalizationPeriodTypeName);
                calculateTaxableBenefitCb.setValue(response.loan.calculateTaxableBenefit);
                
                // onInstalmentChangeEventHandler();
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
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
            innerHTML: 'Edit Loan'
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
        // DEPARTMNT DETAILS SECTION
        //
        
        // Create example section
        loanDetailsSectionEl = lx.createElement('DIV', {
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
        
        let descriptionTxtMargin = '0px 0px 0px 0px';
        if (config.employeeSelect) {
            employeeSelect = new lx.component.Selectbox({
                renderTo: loanDetailsSectionEl,
                label: 'Employee',
                search: true,
                
                onSearch: function() {
                    employeeSelect.clear();
                    loadEmployees( employeeSelect );
                },
                
                onListScrollEnd: function() {
                    loadEmployees( employeeSelect );
                }
            });
            
            loadEmployees(employeeSelect);
            descriptionTxtMargin = '15px 0px 0px 0px';
        }
        
        descriptionTxt = new lx.component.Textbox({
            renderTo: loanDetailsSectionEl,
            label: 'Description',
            margin: descriptionTxtMargin
        });
        
        // statusContainerEl = lx.createElement('DIV', {
        //     parent: loanDetailsSectionEl,
        //     style: {
        //         margin: '15px 0px 0px 0px'
        //     }
        // });
        
        // statusRadio = new lx.component.RadioGroup({
        //     renderTo: statusContainerEl,
        //     label: 'Status',
        //     margin: '0px 0px 0px 0px'
        // });
        
        // startDate = new lx.component.DatePicker({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Start Date',
        //     margin: '15px 0px 0px 0px'
        // });
        
        // loanInterestTypeSelect = new lx.component.Selectbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Interest Type',
        //     margin: '15px 0px 0px 0px',
            
        //     items: app.commonSelectOptions.interestTypes,
            
        //     onChange: onInstalmentChangeEventHandler
        // });
        
        // loanCapitalizationPeriodTypeSelect = new lx.component.Selectbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Capitalization Period',
        //     margin: '15px 0px 0px 0px',
            
        //     items: app.commonSelectOptions.capitalizationPeriodTypes
        // });
        // loanCapitalizationPeriodTypeSelect.setValue('DAIL', 'Daily');
        // loanCapitalizationPeriodTypeSelect.hide();
        
        // interestRateTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Interest Rate',
        //     margin: '15px 0px 0px 0px',
            
        //     onChange: onInstalmentChangeEventHandler
        // });
        
        // amountTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Amount',
        //     margin: '15px 0px 0px 0px',
            
        //     onChange: onInstalmentChangeEventHandler
        // });
        
        // totalPaymentsTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Total Payments',
        //     margin: '15px 0px 0px 0px',
            
        //     onChange: onInstalmentChangeEventHandler
        // });
        
        // instalmentsTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Installment',
        //     margin: '15px 0px 0px 0px'
        // });
        // instalmentsTxt.disable();
        
        let calculateTaxableBenefitContainerEl = new lx.createElement('DIV', {
            parent: loanDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '15px 0px 0px 0px'
            }
        });
        
        calculateTaxableBenefitCb = new lx.component.Checkbox({
            renderTo: calculateTaxableBenefitContainerEl,
            label: 'Enable taxable benefit calculation',
            margin: '0px 0px 0px 0px',
            labelAlign: 'right',
            flex: '1 1 100%'
            // width: '200px'
        });
        // calculateTaxableBenefitCb.setValue(true);
        
        let calculateTaxableBenefitInfoEl = new lx.createElement('DIV', {
            parent: calculateTaxableBenefitContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        let calculateTaxableBenefitTooltipLocusEl = lx.createElement('DIV', {
            parent: calculateTaxableBenefitContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let calculateTaxableBenefitInfoTooltip = new lx.component.Tooltip({
            renderTo: calculateTaxableBenefitTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '390px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' + 
                    // 'A taxable benefit shall be deemed to have been granted to the employee if a loan is given and either no ' +
                    // 'interest is payable by the employee or interest is payable at a lower interest rate in comparison to the ' + 
                    // 'official rate of interest.<br><br>' +
                    // 'The taxable benefit will be calculated and added to the payslip automatically if this box is checked. ' +
                    // 'However, since there are some exceptions to the rule (e.g., under certain conditions when the value of ' +
                    // 'the loan is R3,000 or less), the taxable benefit calculation can be disabled by un-checking the box.' +
                    'The taxable benefit will be calculated and added to the payslip automatically if this box is checked. ' +
                    'Unchecking the box will disable the taxable benefit calculation.' +
                '</span>'
        });
        calculateTaxableBenefitInfoEl.addEventListener('mouseenter', function() { calculateTaxableBenefitInfoTooltip.show(); });
        calculateTaxableBenefitInfoEl.addEventListener('mouseleave', function() { calculateTaxableBenefitInfoTooltip.hide(); });
        
        
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
        
        // Create the editBtnContainerEl element
        editBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the editBtn component
        editBtn = new lx.component.Button({
            renderTo: editBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: editBtnClickEventHandler
        });
        
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
        if (config.employeeSelect === true) {
            employeeSelect.focus();
        }
        else {
            descriptionTxt.focus();
        }
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
    
    /*
    function onInstalmentChangeEventHandler() {
        if (loanInterestTypeSelect.getValue() === 'COMP') {
            loanCapitalizationPeriodTypeSelect.show();
        }
        else {
            loanCapitalizationPeriodTypeSelect.hide();
        }
        
        if (config.employeeId === null) {
            return;
        }
        else if (loanInterestTypeSelect.getValue() === null) {
            return;
        }
        else if (loanCapitalizationPeriodTypeSelect.getValue() === null) {
            return;
        }
        else if (amountTxt.getValue() === '') {
            return;
        }
        else if (totalPaymentsTxt.getValue() === '') {
            return;
        }
        else if (interestRateTxt.getValue() === '') {
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Loan&fn=getInstalment',
            data: {
                employeeId: config.employeeId,
                loanInterestType: loanInterestTypeSelect.getValue(),
                capitilizationPeriodTypeCode: loanCapitalizationPeriodTypeSelect.getValue(),
                principalAmount: amountTxt.getValue(),
                numPayments: parseInt(totalPaymentsTxt.getValue()),
                annualInterestRate: interestRateTxt.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    editBtn.showWarning(response.error);
                    return; 
                }
                
                let instalment = response.instalment;
                instalment = parseFloat(instalment).toFixed(2);
                instalmentsTxt.setValue(instalment);
            }
        });
    }
    */
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Add button click event handler
    function editBtnClickEventHandler() {
        
        if( descriptionTxt.getValue() === '' ) {
            editBtn.showWarning('Please enter a description.');
            return;
        }
        
        // if (config.employeeSelect === true) {
        //     if( employeeSelect.getValue() === '' ) {
        //         editBtn.showWarning('Please select an employee.');
        //         return;
        //     }
        //     else if( descriptionTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter a description.');
        //         return;
        //     }
        //     else if( loanInterestTypeSelect.getValue() === '' ) {
        //         editBtn.showWarning('Please select a interest type.');
        //         return;
        //     }
        //     else if( interestRateTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter an interest rate.');
        //         return;
        //     }
        //     else if( amountTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter an amount.');
        //         return;
        //     }
        //     else if( totalPaymentsTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter the total payments.');
        //         return;
        //     }
        //     else if( startDate.getValue() === '' ) {
        //         editBtn.showWarning('Please specify a starting date.');
        //         return;
        //     }
        //     else if( loanCapitalizationPeriodTypeSelect.getValue() === '' ) {
        //         editBtn.showWarning('Please specify the capitalization period');
        //         return;
        //     }
        // }
        // else {
        //     if( descriptionTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter a description.');
        //         return;
        //     }
        //     else if( loanInterestTypeSelect.getValue() === '' ) {
        //         editBtn.showWarning('Please select a interest type.');
        //         return;
        //     }
        //     else if( interestRateTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter an interest rate.');
        //         return;
        //     }
        //     else if( amountTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter an amount.');
        //         return;
        //     }
        //     else if( totalPaymentsTxt.getValue() === '' ) {
        //         editBtn.showWarning('Please enter the total payments.');
        //         return;
        //     }
        //     else if( startDate.getValue() === '' ) {
        //         editBtn.showWarning('Please specify a starting date.');
        //         return;
        //     }
        //     else if( loanCapitalizationPeriodTypeSelect.getValue() === '' ) {
        //         editBtn.showWarning('Please specify the capitalization period');
        //         return;
        //     }
        // }
        
        editBtn.showLoader();
        editBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Loan&fn=update',
            data: {
                loanId: config.loanId,
                description: descriptionTxt.getValue(),
                // loanStatusCode: statusRadio.getValue()
                // loanInterestType: loanInterestTypeSelect.getValue(),
                // interestRate: interestRateTxt.getValue(),
                // principalAmount: amountTxt.getValue(),
                // totalPayments: parseInt(totalPaymentsTxt.getValue()),
                // startDate: startDate.getValue(),
                // capitalizationPeriod: loanCapitalizationPeriodTypeSelect.getValue()
                calculateTaxableBenefit: calculateTaxableBenefitCb.getValue()
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                editBtn.hideLoader();
                editBtn.enable();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    editBtn.showWarning(response.error);
                    return; 
                }
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};