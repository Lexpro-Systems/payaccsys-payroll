/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW TAX CERTIFICATE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  taxCertificateId           The id of the certificate to view
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewTaxCertificate = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var centeredContainerEl = null;
    
    var headingSectionEl = null;
    var periodEl = null;
    var totalEl = null;
    
    var buttonBarEl = null;
    var downloadButtonEl = null;
    var downloadButtonSectionEl = null;
    var downloadButtonBackgroundEl = null;
    var downloadButtonContentEl = null;
    var downloadButtonLabelEl = null;
    var emailButtonEl = null;
    var emailButtonSectionEl = null;
    var emailButtonBackgroundEl = null;
    var emailButtonContentEl = null;
    var emailButtonlabelEl = null;
    
    var taxCertificateDetailsContainerEl = null;
    var taxCertificateDetailsHeadingContainerEl = null;
    var taxCertificateDetailsHeadingEl = null;
    var taxCertificateDetailsSectionEl = null;
    var taxCertificateNumberDisplay = null;
    var taxYearDisplay = null;
    var typeDisplay = null;
    var payPeriodsDisplay = null;
    var payPeriodsWorkedDisplay = null;
    var fixedRateIncomeDisplay = null;
    var reasonForNonDeductionDisplay = null;
    var voluntaryOverDeductionDisplay = null;
    
    var employerDetailsContainerEl = null;
    var employerDetailsHeadingContainerEl = null;
    var employerDetailsHeadingEl = null;
    var employerDetailsSectionEl = null;
    var employerNameDisplay = null;
    var employerPayeNumberDisplay = null;
    var employerSdlNumberDisplay = null;
    var employerUifNumberDisplay = null;
    var employerDiplomaticIndemnityDisplay = null;
    var employerAddressDisplay = null;
    
    var employeeDetailsContainerEl = null;
    var employeeDetailsHeadingContainerEl = null;
    var employeeDetailsHeadingEl = null;
    var employeeDetailsSectionEl = null;
    var employeeNumberDisplay = null;
    var employeeSurnameDisplay = null;
    var employeeFirstNamesDisplay = null;
    var employeeInitialsDisplay = null;
    var employeeNatureDisplay = null;
    var employeeDateOfBirthDisplay = null;
    var employeeIdNumberDisplay = null;
    var employeePassportNumberDisplay = null;
    var employeeIncomeTaxNumberDisplay = null;
    var employeeAddressDisplay = null;
    var employeeEmployedFromDisplay = null;
    var employeeEmployedToDisplay = null;
    var employeeTaxDirective1Display = null;
    var employeeTaxDirective2Display = null;
    var employeeTaxDirective3Display = null;
    
    var incomeContainerEl = null;
    var incomeHeadingContainerEl = null;
    var incomeDetailsHeadingEl = null;
    var incomeDetailsSectionEl = null;
    var incomeGrid = null;
    
    var grossRemunerationContainerEl = null;
    var grossRemunerationHeadingContainerEl = null;
    var grossRemunerationDetailsHeadingEl = null;
    var grossRemunerationDetailsSectionEl = null;
    var grossRemunerationGrid = null;
    
    var deductionsContainerEl = null;
    var deductionsHeadingContainerEl = null;
    var deductionsDetailsHeadingEl = null;
    var deductionsDetailsSectionEl = null;
    var deductionsGrid = null;
    
    var taxDeductionsContainerEl = null;
    var taxDeductionsHeadingContainerEl = null;
    var taxDeductionsDetailsHeadingEl = null;
    var taxDeductionsDetailsSectionEl = null;
    var taxDeductionsGrid = null;
    
    var taxCertificateId = null;
    var isSendingCertificate = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the certificate
    function loadCertificate() {
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=get',
            data: {
                taxCertificateId: config.taxCertificateId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Certificate Failed',
                        message: response.error
                    });
                }
                
                // Set the headings
                periodEl.innerHTML = response.taxCertificate.taxCertificateType + ' Tax Certificate'; // + ': ' + response.taxCertificate.taxCertificateNumber
                totalEl.innerHTML = response.taxCertificate.sarsYear + ' Tax Year';
                
                // Set tax certificate details
                let fixedRateIncome = 'No';
                if( response.taxCertificate.fixedRateIncome === true ) {
                    fixedRateIncome = 'Yes';
                }
                
                let voluntaryOverDeduction = 'No';
                if( response.taxCertificate.voluntaryOverDeduction === true ) {
                    voluntaryOverDeduction = 'Yes';
                }
                
                let reasonForNonDeduction = response.taxCertificate.reasonForNonDeduction;
                if( response.taxCertificate.reasonForNonDeduction === '' ) {
                    reasonForNonDeduction = '-';
                }
                
                taxCertificateNumberDisplay.setValue(response.taxCertificate.taxCertificateNumber);
                taxYearDisplay.setValue(response.taxCertificate.sarsYear);
                typeDisplay.setValue(response.taxCertificate.taxCertificateType);
                payPeriodsDisplay.setValue(response.taxCertificate.payPeriods);
                payPeriodsWorkedDisplay.setValue(response.taxCertificate.payPeriodsWorked);
                fixedRateIncomeDisplay.setValue(fixedRateIncome);
                voluntaryOverDeductionDisplay.setValue(voluntaryOverDeduction);
                reasonForNonDeductionDisplay.setValue(reasonForNonDeduction);
                
                // Set employer details
                let diplomaticIndemnity = 'No';
                if( response.taxCertificate.employer.diplomaticIndemnity === true ) {
                    diplomaticIndemnity = 'Yes';
                }
                
                let employerAddress = '';
                if( response.taxCertificate.employer.addressLine1 !== '' ) {
                    if( employerAddress !== '' ) employerAddress = employerAddress + '<br />';
                    employerAddress = employerAddress + response.taxCertificate.employer.addressLine1;
                }
                if( response.taxCertificate.employer.addressLine2 !== '' ) {
                    if( employerAddress !== '' ) employerAddress = employerAddress + '<br />';
                    employerAddress = employerAddress + response.taxCertificate.employer.addressLine2;
                }
                if( response.taxCertificate.employer.addressLine3 !== '' ) {
                    if( employerAddress !== '' ) employerAddress = employerAddress + '<br />';
                    employerAddress = employerAddress + response.taxCertificate.employer.addressLine3;
                }
                if( response.taxCertificate.employer.addressCode !== '' ) {
                    if( employerAddress !== '' ) employerAddress = employerAddress + '<br />';
                    employerAddress = employerAddress + response.taxCertificate.employer.addressCode;
                }
                if( employerAddress === '' ) employerAddress = '-';
                
                employerNameDisplay.setValue(response.taxCertificate.employer.name);
                employerPayeNumberDisplay.setValue(response.taxCertificate.employer.payeNumber);
                employerUifNumberDisplay.setValue(response.taxCertificate.employer.uifNumber);
                employerSdlNumberDisplay.setValue(response.taxCertificate.employer.sdlNumber);
                employerDiplomaticIndemnityDisplay.setValue(diplomaticIndemnity);
                employerAddressDisplay.setValue( employerAddress );
                
                // Set employee details
                let idNumber = response.taxCertificate.employee.idNumber;
                if( response.taxCertificate.employee.idNumber === '' ) {
                    idNumber = '-';
                }
                
                let passportNumber = response.taxCertificate.employee.passportNumber;
                if( response.taxCertificate.employee.passportNumber === '' ) {
                    passportNumber = '-';
                }
                
                let incomeTaxNumber = response.taxCertificate.employee.incomeTaxNumber;
                if( response.taxCertificate.employee.incomeTaxNumber === '' ) {
                    incomeTaxNumber = '-';
                }
                
                let directive1 = response.taxCertificate.employee.directive1;
                if( response.taxCertificate.employee.directive1 === '' ) {
                    directive1 = '-';
                }
                
                let directive2 = response.taxCertificate.employee.directive2;
                if( response.taxCertificate.employee.directive2 === '' ) {
                    directive2 = '-';
                }
                
                let directive3 = response.taxCertificate.employee.directive3;
                if( response.taxCertificate.employee.directive3 === '' ) {
                    directive3 = '-';
                }
                
                let employeeAddress = '';
                if( response.taxCertificate.employee.addressLine1 !== '' ) {
                    if( employeeAddress !== '' ) employeeAddress = employeeAddress + '<br />';
                    employeeAddress = employeeAddress + response.taxCertificate.employee.addressLine1;
                }
                if( response.taxCertificate.employee.addressLine2 !== '' ) {
                    if( employeeAddress !== '' ) employeeAddress = employeeAddress + '<br />';
                    employeeAddress = employeeAddress + response.taxCertificate.employee.addressLine2;
                }
                if( response.taxCertificate.employee.addressLine3 !== '' ) {
                    if( employeeAddress !== '' ) employeeAddress = employeeAddress + '<br />';
                    employeeAddress = employeeAddress + response.taxCertificate.employee.addressLine3;
                }
                if( response.taxCertificate.employee.addressCode !== '' ) {
                    if( employeeAddress !== '' ) employeeAddress = employeeAddress + '<br />';
                    employeeAddress = employeeAddress + response.taxCertificate.employee.addressCode;
                }
                if( employeeAddress === '' ) employeeAddress = '-';
                
                employeeNumberDisplay.setValue(response.taxCertificate.employee.number);
                employeeSurnameDisplay.setValue(response.taxCertificate.employee.surname);
                employeeFirstNamesDisplay.setValue(response.taxCertificate.employee.firstNames);
                employeeInitialsDisplay.setValue(response.taxCertificate.employee.initials);
                employeeNatureDisplay.setValue(response.taxCertificate.employee.nature);
                employeeDateOfBirthDisplay.setValue(response.taxCertificate.employee.dateOfBirth);
                employeeIdNumberDisplay.setValue(idNumber);
                employeePassportNumberDisplay.setValue(passportNumber);
                employeeIncomeTaxNumberDisplay.setValue(incomeTaxNumber);
                employeeAddressDisplay.setValue(employeeAddress);
                employeeEmployedFromDisplay.setValue(response.taxCertificate.employee.employedFrom);
                employeeEmployedToDisplay.setValue( (response.taxCertificate.employee.employedTo !== null ? response.taxCertificate.employee.employedTo : '-') );
                employeeTaxDirective1Display.setValue(directive1);
                employeeTaxDirective2Display.setValue(directive2);
                employeeTaxDirective3Display.setValue(directive3);
                
                // Set income items
                let income = [];
                for( let i = 0; i < response.taxCertificate.incomeItems.length; i++ ) {
                    income.push({
                        code: response.taxCertificate.incomeItems[i].code,
                        description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + response.taxCertificate.incomeItems[i].description + '</div>',
                        rfIndicator: response.taxCertificate.incomeItems[i].rfIndicator,
                        amount: lx.util.formatCurrency(response.taxCertificate.incomeItems[i].amount)
                    });
                }
                incomeGrid.clear();
                incomeGrid.addRows(income);
                
                // Set gross remuneration
                let grossRemuneration = [];
                grossRemuneration.push({
                    code: '3696',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'GROSS NON-TAXABLE INCOME' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.grossRemuneration.totalNonTaxableIncome)
                });
                grossRemuneration.push({
                    code: '3699',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'GROSS EMPLOYMENT INCOME' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.grossRemuneration.totalTaxableIncome)
                });
                grossRemunerationGrid.clear();
                grossRemunerationGrid.addRows(grossRemuneration);
                
                // Set deduction items
                let deductions = [];
                for( let i = 0; i < response.taxCertificate.deductionItems.length; i++ ) {
                    deductions.push({
                        code: response.taxCertificate.deductionItems[i].code,
                        description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + response.taxCertificate.deductionItems[i].description + '</div>',
                        clearanceNumber: response.taxCertificate.deductionItems[i].clearanceNumber,
                        amount: lx.util.formatCurrency(response.taxCertificate.deductionItems[i].amount)
                    });
                }
                deductionsGrid.clear();
                deductionsGrid.addRows(deductions);
                
                // Set tax deductions
                let taxDeductions = [];
                taxDeductions.push({
                    code: '4102',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'PAY AS YOU EARN - PAYE' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalPaye)
                });
                taxDeductions.push({
                    code: '4115',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'PAYE ON LUMP SUMS' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalPayeOnLumpSums)
                });
                taxDeductions.push({
                    code: '4116',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'MEDICAL SCHEME FEES TAX CREDIT ' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalMedicalExpenses)
                });
                taxDeductions.push({
                    code: '4120',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'ADDITIONAL MEDICAL EXPENSES TAX CREDIT' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalMedicalSchemeCredit)
                });
                taxDeductions.push({
                    code: '4141',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'EMPLOYER AND EMPLOYEE UIF CONTRIBUTION' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalUif)
                });
                taxDeductions.push({
                    code: '4142',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'EMPLOYER SDL CONTRIBUTION' + '</div>',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalSdl)
                });
                let totalTax = parseFloat(response.taxCertificate.taxDeductions.totalPaye) + parseFloat(response.taxCertificate.taxDeductions.totalUif) + parseFloat(response.taxCertificate.taxDeductions.totalSdl);
                taxDeductions.push({
                    code: '4149',
                    description: '<div style="overflow: hidden; text-overflow: ellipsis;">' + 'TOTAL TAX, SDL, AND UIF' + '</div>',
                    amount: lx.util.formatCurrency( totalTax )
                });
                taxDeductionsGrid.clear();
                taxDeductionsGrid.addRows(taxDeductions);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            taxCertificateId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        
        // Initialize state
        taxCertificateId = compConfig.taxCertificateId;
        
        // Clear the background color of the container to show the backgroun image
        me.getContainer().style.backgroundColor = '';
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                // backgroundColor: app.panelBackgroundColor,
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
            innerHTML: '<i class="fa fa-fw fa-scroll" style="margin: 0px 15px 0px 0px;"></i>View Certificate: ' + config.employeeName
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
                padding: '0px 0px 0px 0px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        
        // Create the centeredContainerEl component
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                maxWidth: '768px'
            }
        });
        
        
        //
        // HEADING SECTION
        //
        
        // Create headingSectionEl
        headingSectionEl = app.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '15px 0px 0px 0px',
                padding: '20px 0px',
                width: '100%',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: app.sectionBorderRadius
            }
        });
        
        // Create periodEl element
        periodEl = app.createElement('DIV', {
            parent: headingSectionEl,
            style: {
                fontSize: '24px',
                textAlign: 'center',
                margin: '0px 0px 0px 0px'
            },
            innerHTML: ''
        });
        
        // Create totalEl element
        totalEl = app.createElement('DIV', {
            parent: headingSectionEl,
            style: {
                fontSize: '18px',
                margin: '5px 0px 0px 0px',
                textAlign: 'center'
            },
            innerHTML: ''
        });
        
        // Create the buttonBarEl component
        buttonBarEl = lx.createElement('DIV', {
            parent: headingSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                position: 'relative',
                boxSizing: 'border-box',
                margin: '15px auto 0px auto',
                flex: '0 0 auto',
                border: 'none',
                width: '100%',
                justifyContent: 'space-evenly'
            }
        });
        
        // Create the downloadButtonEl component
        downloadButtonEl = lx.createElement('DIV', {
            parent: buttonBarEl,
            style: {
                width: '150px',
                tranform: 'scale(0, 0)'
            }
        });
        
        // Create the downloadButtonSectionEl component
        downloadButtonSectionEl = lx.createElement('DIV', {
            parent: downloadButtonEl,
            style: {
                width: '40px',
                height: '40px',
                margin: '0px auto',
                position: 'relative'
            }
        });
        
        // Create the downloadButtonBackgroundEl component
        downloadButtonBackgroundEl = lx.createElement('DIV', {
            parent: downloadButtonSectionEl,
            style: {
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: lx.style.global.highlightColor,
                position: 'absolute'
            }
        });
        
        // Create the downloadButtonContentEl component
        downloadButtonContentEl = lx.createElement('DIV', {
            parent: downloadButtonSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                cursor: 'pointer',
                position: 'absolute',
                width: '100%',
                height: '100%',
                color: '#FFFFFF',
                transition: 'opacity 0.25s 0.0s ease-in'
            },
            innerHTML: '<i class="fa fa-download" style="font-size: 18px;"></i>'
        });
        downloadButtonContentEl.addEventListener('click', downloadBtnClickEventHandler);
        
        // Create the downloadButtonLabelEl component
        downloadButtonLabelEl = lx.createElement('DIV', {
            parent: downloadButtonEl,
            style: {
                fontSize: '12px',
                textAlign: 'center',
                margin: '8px 0px 0px 0px',
                color: app.filterBackgroundColor
            },
            innerHTML: 'Download'
        });
        
        // Create the emailButtonEl component
        emailButtonEl = lx.createElement('DIV', {
            parent: buttonBarEl,
            style: {
                minWidth: '150px',
                tranform: 'scale(0, 0)'
            }
        });
        
        // Create the emailButtonSectionEl component
        emailButtonSectionEl = lx.createElement('DIV', {
            parent: emailButtonEl,
            style: {
                width: '40px',
                height: '40px',
                margin: '0px auto',
                position: 'relative'
            }
        });
        
        // Create the emailButtonBackgroundEl component
        emailButtonBackgroundEl = lx.createElement('DIV', {
            parent: emailButtonSectionEl,
            style: {
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: lx.style.global.highlightColor,
                position: 'absolute'
            }
        });
        
        // Create the emailButtonContentEl component
        emailButtonContentEl = lx.createElement('DIV', {
            parent: emailButtonSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                cursor: 'pointer',
                position: 'absolute',
                width: '100%',
                height: '100%',
                color: '#FFFFFF',
                transition: 'opacity 0.25s 0.0s ease-in'
            },
            innerHTML: '<i class="far fa-envelope" style="font-size: 18px;"></i>'
        });
        emailButtonContentEl.addEventListener('click', emailToBtnClickEventHandler);
        
        // Create the emailButtonlabelEl component
        emailButtonlabelEl = lx.createElement('DIV', {
            parent: emailButtonEl,
            style: {
                fontSize: '12px',
                textAlign: 'center',
                margin: '8px 0px 0px 0px',
                color: app.filterBackgroundColor
            },
            innerHTML: 'Send to Self'
        });
        
        
        //
        // TAX CERTIIFCATE DETAILS SECTION
        //
        
        // Create the taxCertificateDetailsContainerEl
        taxCertificateDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        // Create the taxCertificateDetailsHeadingContainerEl
        taxCertificateDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: taxCertificateDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        // Create the taxCertificateDetailsHeadingContainerEl
        taxCertificateDetailsHeadingEl = lx.createElement('DIV', {
            parent: taxCertificateDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Certificate Details</div>'
        });
        
        // Create the taxCertificateDetailsSectionEl
        taxCertificateDetailsSectionEl = lx.createElement('DIV', {
            parent: taxCertificateDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        // Create the taxCertificateNumberDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Certificate Number:'
        });
        taxCertificateNumberDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Certificate Number:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the taxYearDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Tax Year:'
        });
        taxYearDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Tax Year:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the typeDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Type:'
        });
        typeDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Type:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the payPeriodsDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Pay Periods:'
        });
        payPeriodsDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Pay Periods:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the payPeriodsWorkedDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Pay Periods Worked:'
        });
        payPeriodsWorkedDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Pay Periods Worked:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the fixedRateIncomeDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Fixed Rate Income:'
        });
        fixedRateIncomeDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Fixed Rate Income:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the voluntaryOverDeductionDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Voluntary Over Deduction:'
        });
        voluntaryOverDeductionDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Voluntary Over Deduction:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        // Create the reasonForNonDeductionDisplay component
        lx.createElement('DIV', {
            parent: taxCertificateDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Reason For Non-Deduction:'
        });
        reasonForNonDeductionDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Reason For Non-Deduction:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        
        //
        // EMPLOYER DETAILS SECTION
        //
        
        employerDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        employerDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: employerDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        employerDetailsHeadingEl = lx.createElement('DIV', {
            parent: employerDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Employer Details</div>'
        });
        
        employerDetailsSectionEl = lx.createElement('DIV', {
            parent: employerDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Name:'
        });
        employerNameDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Name:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'PAYE Reference:'
        });
        employerPayeNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'PAYE Reference:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'SDL Reference:'
        });
        employerSdlNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'SDL Reference:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'UIF Reference:'
        });
        employerUifNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'UIF Reference:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Diplomatic Indemnity:'
        });
        employerDiplomaticIndemnityDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Diplomatic Indemnity:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employerDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Address:'
        });
        employerAddressDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Address:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        
        //
        // EMPLOYEE DETAILS SECTION
        //
        
        employeeDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        employeeDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: employeeDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        employeeDetailsHeadingEl = lx.createElement('DIV', {
            parent: employeeDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Employee Details</div>'
        });
        
        employeeDetailsSectionEl = lx.createElement('DIV', {
            parent: employeeDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Number:'
        });
        employeeNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Number:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Surname:'
        });
        employeeSurnameDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Surname:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'First Names:'
        });
        employeeFirstNamesDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'First Names:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Initials:'
        });
        employeeInitialsDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Initials:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Nature:'
        });
        employeeNatureDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Nature:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Date of Birth:'
        });
        employeeDateOfBirthDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Date of Birth:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'ID Number:'
        });
        employeeIdNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'ID Number:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Passport Number:'
        });
        employeePassportNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Passport Number:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Income Tax Number:'
        });
        employeeIncomeTaxNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Income Tax Number:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Address:'
        });
        employeeAddressDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Address:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Employed From:'
        });
        employeeEmployedFromDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Employed From:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Employed To:'
        });
        employeeEmployedToDisplay = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Employed To:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Tax Directive 1:'
        });
        employeeTaxDirective1Display = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Tax Directive 1:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Tax Directive 2:'
        });
        employeeTaxDirective2Display = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Tax Directive 2:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        lx.createElement('DIV', {
            parent: employeeDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 2px 0px',
                fontSize: '12px',
                color: '#7A7A7A'
            },
            innerHTML: 'Tax Directive 3:'
        });
        employeeTaxDirective3Display = new lx.component.Display({
            renderTo: employeeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            // label: 'Tax Directive 3:',
            // labelAlign: 'left',
            // labelWidth: '220px',
            // maxWidth: '500px'
        });
        
        
        //
        // INCOME SECTION
        //
        
        incomeContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        incomeHeadingContainerEl = lx.createElement('DIV', {
            parent: incomeContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        incomeDetailsHeadingEl = lx.createElement('DIV', {
            parent: incomeHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Income</div>'
        });
        
        incomeDetailsSectionEl = lx.createElement('DIV', {
            parent: incomeContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                // padding: '15px'
            }
        });
        
        incomeGrid = new lx.component.Grid({
            renderTo: incomeDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '50px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '120px'}
            ],
            
            onCellClick: function( event ) {
                // Depending on the column clicked
                if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
                    new lx.component.Messagebox({
                        // title: 'Loading Employees Failed',
                        message: incomeGrid.getRow(event.rowIndex).description
                    });
                }
            }
        });
        
        
        //
        // GROSS REMUNERATION SECTION
        //
        
        grossRemunerationContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        grossRemunerationHeadingContainerEl = lx.createElement('DIV', {
            parent: grossRemunerationContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        grossRemunerationDetailsHeadingEl = lx.createElement('DIV', {
            parent: grossRemunerationHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Gross Remuneration</div>'
        });
        
        grossRemunerationDetailsSectionEl = lx.createElement('DIV', {
            parent: grossRemunerationContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                // padding: '15px'
            }
        });
        
        grossRemunerationGrid = new lx.component.Grid({
            renderTo: grossRemunerationDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '50px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '120px'}
            ],
            
            onCellClick: function( event ) {
                // Depending on the column clicked
                if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
                    new lx.component.Messagebox({
                        // title: 'Loading Employees Failed',
                        message: grossRemunerationGrid.getRow(event.rowIndex).description
                    });
                }
            }
        });
        
        
        //
        // DEDUCTIONS SECTION
        //
        
        deductionsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        deductionsHeadingContainerEl = lx.createElement('DIV', {
            parent: deductionsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        deductionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: deductionsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Deductions</div>'
        });
        
        deductionsDetailsSectionEl = lx.createElement('DIV', {
            parent: deductionsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                // padding: '15px'
            }
        });
        
        deductionsGrid = new lx.component.Grid({
            renderTo: deductionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '50px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '120px'}
            ],
            
            onCellClick: function( event ) {
                // Depending on the column clicked
                if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
                    new lx.component.Messagebox({
                        // title: 'Loading Employees Failed',
                        message: deductionsGrid.getRow(event.rowIndex).description
                    });
                }
            }
        });
        
        
        //
        // TAX DEDUCTIONS SECTION
        //
        
        taxDeductionsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        taxDeductionsHeadingContainerEl = lx.createElement('DIV', {
            parent: taxDeductionsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        taxDeductionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: taxDeductionsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Tax Deductions</div>'
        });
        
        taxDeductionsDetailsSectionEl = lx.createElement('DIV', {
            parent: taxDeductionsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                // padding: '15px'
            }
        });
        
        taxDeductionsGrid = new lx.component.Grid({
            renderTo: taxDeductionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '50px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '120px'}
            ],
            
            onCellClick: function( event ) {
                // Depending on the column clicked
                if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
                    new lx.component.Messagebox({
                        // title: 'Loading Employees Failed',
                        message: taxDeductionsGrid.getRow(event.rowIndex).description
                    });
                }
            }
        });
        
        // Load form data
        loader.show(false);
        loadCertificate();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // emailToBtn click event handler
    function emailToBtnClickEventHandler() {
        if( isSendingCertificate ) {
            return;
        }
        
        isSendingCertificate = true;
        app.applyStyle(emailButtonBackgroundEl, {backgroundColor: '#666666'});
        
        
        // Add the certificate to the list
        let emailData = [];
        emailData.push({
            id: config.taxCertificateId
        });
        
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=send',
            data: {
                emailData: emailData
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                isSendingCertificate = false;
                app.applyStyle(emailButtonBackgroundEl, {backgroundColor: lx.style.global.highlightColor});
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Sending Certificate Failed',
                        message: response.error
                    });
                    return; 
                }
                
                new lx.component.Messagebox({
                    title: 'Send Certificate',
                    message: 'The certificate was successfully sent to your email address.'
                });
            }
        });
    }
    
    // downloadBtn click event handler
    function downloadBtnClickEventHandler() {
        lx.sendForm({
            url: 'exec.php?c=TaxCertificate&fn=download',
            target: '_blank',
            data: {
                taxCertificateId: config.taxCertificateId
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};