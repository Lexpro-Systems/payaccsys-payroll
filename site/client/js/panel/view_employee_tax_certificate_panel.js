/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE TAX CERTIFICATE PANEL
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
app.panel.ViewEmployeeTaxCertificate = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var downloadBtn = null;
    var emailToBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
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
    
    var employerDetailsContainer = null;
    var employerDetailsDetailsHeadingEl = null;
    var employerDetailsDetailsSectionEl = null;
    var employerNameDisplay = null;
    var employerPayeNumberDisplay = null;
    var employerSdlNumberDisplay = null;
    var employerUifNumberDisplay = null;
    var employerDiplomaticIndemnityDisplay = null;
    var employerAddressDisplay = null;
    
    var employeeDetailsContainer = null;
    var employeeDetailsDetailsHeadingEl = null;
    var employeeDetailsDetailsSectionEl = null;
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
    
    var incomeContainer = null;
    var incomeDetailsHeadingEl = null;
    var incomeDetailsSectionEl = null;
    var incomeGrid = null;
    
    var grossRemunerationContainer = null;
    var grossRemunerationDetailsHeadingEl = null;
    var grossRemunerationDetailsSectionEl = null;
    var grossRemunerationGrid = null;
    
    var deductionsContainer = null;
    var deductionsDetailsHeadingEl = null;
    var deductionsDetailsSectionEl = null;
    var deductionsGrid = null;
    
    var taxDeductionsContainer = null;
    var taxDeductionsDetailsHeadingEl = null;
    var taxDeductionsDetailsSectionEl = null;
    var taxDeductionsGrid = null;
    
    var taxCertificateId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the tax certificate
    function loadTaxCertificate() {
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
                
                // Set tax certificate details
                let fixedRateIncome = 'N';
                if( response.taxCertificate.fixedRateIncome === true ) {
                    fixedRateIncome = 'Y';
                }
                
                let voluntaryOverDeduction = 'N';
                if( response.taxCertificate.voluntaryOverDeduction === true ) {
                    voluntaryOverDeduction = 'Y';
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
                let diplomaticIndemnity = 'N';
                if( response.taxCertificate.employer.diplomaticIndemnity === true ) {
                    diplomaticIndemnity = 'Y';
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
                employeeEmployedToDisplay.setValue(response.taxCertificate.employee.employedTo);
                employeeTaxDirective1Display.setValue(directive1);
                employeeTaxDirective2Display.setValue(directive2);
                employeeTaxDirective3Display.setValue(directive3);
                
                // Set income items
                let income = [];
                for( let i = 0; i < response.taxCertificate.incomeItems.length; i++ ) {
                    income.push({
                        code: response.taxCertificate.incomeItems[i].code,
                        description: response.taxCertificate.incomeItems[i].description,
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
                    description: 'GROSS NON-TAXABLE INCOME',
                    amount: lx.util.formatCurrency(response.taxCertificate.grossRemuneration.totalNonTaxableIncome)
                });
                grossRemuneration.push({
                    code: '3699',
                    description: 'GROSS EMPLOYMENT INCOME',
                    amount: lx.util.formatCurrency(response.taxCertificate.grossRemuneration.totalTaxableIncome)
                });
                grossRemunerationGrid.clear();
                grossRemunerationGrid.addRows(grossRemuneration);
                
                // Set deduction items
                let deductions = [];
                for( let i = 0; i < response.taxCertificate.deductionItems.length; i++ ) {
                    deductions.push({
                        code: response.taxCertificate.deductionItems[i].code,
                        description: response.taxCertificate.deductionItems[i].description,
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
                    description: 'PAY AS YOU EARN - PAYE',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalPaye)
                });
                taxDeductions.push({
                    code: '4115',
                    description: 'PAYE ON LUMP SUMS',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalPayeOnLumpSums)
                });
                taxDeductions.push({
                    code: '4116',
                    description: 'MEDICAL SCHEME FEES TAX CREDIT ',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalMedicalExpenses)
                });
                taxDeductions.push({
                    code: '4120',
                    description: 'ADDITIONAL MEDICAL EXPENSES TAX CREDIT',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalMedicalSchemeCredit)
                });
                taxDeductions.push({
                    code: '4141',
                    description: 'EMPLOYER AND EMPLOYEE UIF CONTRIBUTION',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalUif)
                });
                taxDeductions.push({
                    code: '4142',
                    description: 'EMPLOYER SDL CONTRIBUTION',
                    amount: lx.util.formatCurrency(response.taxCertificate.taxDeductions.totalSdl)
                });
                let totalTax = parseFloat(response.taxCertificate.taxDeductions.totalPaye) + parseFloat(response.taxCertificate.taxDeductions.totalUif) + parseFloat(response.taxCertificate.taxDeductions.totalSdl);
                taxDeductions.push({
                    code: '4149',
                    description: 'TOTAL TAX, SDL, AND UIF',
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
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,
            
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
        confirmDestroy = false;
        taxCertificateId = compConfig.taxCertificateId;
        
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
            innerHTML: 'View Employee Tax Certificate: ' + config.employeeName
        });
        
        emailToBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Email To',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: emailToBtnClickEventHandler
        });
        
        downloadBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Download',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 20px',
            
            onClick: downloadBtnClickEventHandler
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
                padding: '0px 15px 15px 15px'
            }
        });
        
        
        //
        // TAX CERTIIFCATE DETAILS SECTION
        //
        
        // Create the taxCertificateDetailsHeadingEl element
        taxCertificateDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Certificate Details</div>'
        });
        
        // Create the taxCertificateDetailsSectionEl
        taxCertificateDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the taxCertificateNumberDisplay component
        taxCertificateNumberDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Certificate Number:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the taxYearDisplay component
        taxYearDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Tax Year:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the typeDisplay component
        typeDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Type:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the payPeriodsDisplay component
        payPeriodsDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Pay Periods:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the payPeriodsWorkedDisplay component
        payPeriodsWorkedDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Pay Periods Worked:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the fixedRateIncomeDisplay component
        fixedRateIncomeDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Fixed Rate Income:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the voluntaryOverDeductionDisplay component
        voluntaryOverDeductionDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Voluntary Over Deduction:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the reasonForNonDeductionDisplay component
        reasonForNonDeductionDisplay = new lx.component.Display({
            renderTo: taxCertificateDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Reason For Non-Deduction:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        
        //
        // EMPLOYER DETAILS SECTION
        //
        
        employerDetailsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        employerDetailsDetailsHeadingEl = lx.createElement('DIV', {
            parent: employerDetailsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employer Details</div>'
        });
        
        employerDetailsDetailsSectionEl = lx.createElement('DIV', {
            parent: employerDetailsContainer,
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
        
        employerNameDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employerPayeNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'PAYE Reference:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employerSdlNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'SDL Reference:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employerUifNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'UIF Reference:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employerDiplomaticIndemnityDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Diplomatic Indemnity:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employerAddressDisplay = new lx.component.Display({
            renderTo: employerDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Address:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        
        //
        // EMPLOYEE DETAILS SECTION
        //
        
        employeeDetailsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        employeeDetailsDetailsHeadingEl = lx.createElement('DIV', {
            parent: employeeDetailsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employee Details</div>'
        });
        
        employeeDetailsDetailsSectionEl = lx.createElement('DIV', {
            parent: employeeDetailsContainer,
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
        
        employeeNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Number:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeSurnameDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Surname:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeFirstNamesDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'First Names:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeInitialsDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Initials:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeNatureDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Nature:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeDateOfBirthDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Date of Birth:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeIdNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'ID Number:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeePassportNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Passport Number:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeIncomeTaxNumberDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Income Tax Number:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeAddressDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Address:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeEmployedFromDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employed From:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeEmployedToDisplay = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employed To:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeTaxDirective1Display = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Tax Directive 1:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeTaxDirective2Display = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Tax Directive 2:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        employeeTaxDirective3Display = new lx.component.Display({
            renderTo: employeeDetailsDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Tax Directive 3:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        
        //
        // INCOME SECTION
        //
        
        incomeContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        incomeDetailsHeadingEl = lx.createElement('DIV', {
            parent: incomeContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Income</div>'
        });
        
        incomeDetailsSectionEl = lx.createElement('DIV', {
            parent: incomeContainer,
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
        
        incomeGrid = new lx.component.Grid({
            renderTo: incomeDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // GROSS REMUNERATION SECTION
        //
        
        grossRemunerationContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        grossRemunerationDetailsHeadingEl = lx.createElement('DIV', {
            parent: grossRemunerationContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Gross Remuneration</div>'
        });
        
        grossRemunerationDetailsSectionEl = lx.createElement('DIV', {
            parent: grossRemunerationContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        grossRemunerationGrid = new lx.component.Grid({
            renderTo: grossRemunerationDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // DEDUCTIONS SECTION
        //
        
        deductionsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        deductionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: deductionsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Deductions</div>'
        });
        
        deductionsDetailsSectionEl = lx.createElement('DIV', {
            parent: deductionsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        deductionsGrid = new lx.component.Grid({
            renderTo: deductionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // TAX DEDUCTIONS SECTION
        //
        
        taxDeductionsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        taxDeductionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: taxDeductionsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 5px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Tax Deductions</div>'
        });
        
        taxDeductionsDetailsSectionEl = lx.createElement('DIV', {
            parent: taxDeductionsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        taxDeductionsGrid = new lx.component.Grid({
            renderTo: taxDeductionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'amount', name: 'Amount', alignment: 'right', width: '130px'}
            ]
        });
        
        // Load form data
        loader.show(false);
        loadTaxCertificate();
        
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
    
    function emailToBtnClickEventHandler() {
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
            taxCertificateId: config.taxCertificateId,
            emailAddress: config.emailAddress,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSend: function() {
                app.route.popState();
                
                new lx.component.Messagebox({
                    title: 'Email Tax Certificate',
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
        if( config.hasOwnProperty('viewEmployeePanel') ) {
            config.viewEmployeePanel.show();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};