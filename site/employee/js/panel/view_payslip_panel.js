/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW PAYSLIP PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  payslipId           The id of the payslip to view
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewPayslip = function(config) {
    
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
    var downloadButtonlabelEl = null;
    var emailButtonEl = null;
    var emailButtonSectionEl = null;
    var emailButtonBackgroundEl = null;
    var emailButtonContentEl = null;
    var emailButtonlabelEl = null;
    
    var earningsContainer = null;
    var earningsDetailsHeadingContainerEl = null;
    var earningsDetailsHeadingEl = null;
    var earningsDetailsSectionEl = null;
    var earningsGrid = null;
    
    var deductionsContainer = null;
    var deductionsDetailsHeadingContainerEl = null;
    var deductionsDetailsHeadingEl = null;
    var deductionsDetailsSectionEl = null;
    var deductionsGrid = null;
    
    var companyContributionsContainer = null;
    var companyContributionsDetailsHeadingContainerEl = null;
    var companyContributionsDetailsHeadingEl = null;
    var companyContributionsDetailsSectionEl = null;
    var companyContributionsGrid = null;
    
    var fringeBenefitsContainer = null;
    var fringeBenefitsDetailsHeadingContainerEl = null;
    var fringeBenefitsDetailsHeadingEl = null;
    var fringeBenefitsDetailsSectionEl = null;
    var fringeBenefitsGrid = null;
    
    var allowancesContainer = null;
    var allowancesDetailsHeadingContainerEl = null;
    var allowancesDetailsHeadingEl = null;
    var allowancesDetailsSectionEl = null;
    var allowancesGrid = null;
    
    var payslipId = null;
    var isSendingPayslip = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the payslip
    function loadPayslip() {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getPayslipItems',
            data: {
                payslipId: config.payslipId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Failed',
                        message: response.error
                    });
                }
                
                periodEl.innerHTML = response.payslip.payslipDetails.fromDate + ' to ' + response.payslip.payslipDetails.toDate;
                totalEl.innerHTML = 'Nett Pay: ' + lx.util.formatCurrency(response.payslip.netSalaryTotal);
                
                // For every paylsip item
                let earnings = [];
                let deductions = [];
                let companyContributions = [];
                let fringeBenefits = [];
                let allowances = [];
                for( var i = 0; i < response.payslip.payslipItems.length; i++ ) {
                    // Is it an income item?
                    if (response.payslip.payslipItems[i].payslipCategoryCode === 'INCO') {
                        let description = response.payslip.payslipItems[i].description;
                        
                        // Is it an overtime item?
                        if( response.payslip.payslipItems[i].payslipItemTypeCode == '1005' ) {
                            description = description + ' (' + response.payslip.payslipItems[i].units + ' hours)';
                        }
                        
                        // Add the item to the earnings array
                        earnings.push({
                            id: response.payslip.payslipItems[i].id,
                            description: description,
                            accrualDate: response.payslip.payslipItems[i].accrualDate,
                            total: lx.util.formatCurrency(response.payslip.payslipItems[i].total)
                            
                        });
                    }
                    
                    // Is it a deduction item?
                    if (response.payslip.payslipItems[i].payslipCategoryCode === 'DEDU') {
                        // Add the item to the deductions array
                        deductions.push({
                            id: response.payslip.payslipItems[i].id,
                            description: response.payslip.payslipItems[i].description,
                            accrualDate: response.payslip.payslipItems[i].accrualDate,
                            total: lx.util.formatCurrency(response.payslip.payslipItems[i].total)
                            
                        });
                    }
                    
                    // Is it a contributions item?
                    if (response.payslip.payslipItems[i].payslipCategoryCode === 'CONT') {
                        // Add the item to the company contributions array
                        companyContributions.push({
                            id: response.payslip.payslipItems[i].id,
                            description: response.payslip.payslipItems[i].description,
                            accrualDate: response.payslip.payslipItems[i].accrualDate,
                            total: lx.util.formatCurrency(response.payslip.payslipItems[i].total)
                            
                        });
                    }
                    
                    // Is it a fringe benefit item?
                    if (response.payslip.payslipItems[i].payslipCategoryCode === 'FBEN') {
                        // Add the item to the fringe benefits array
                        fringeBenefits.push({
                            id: response.payslip.payslipItems[i].id,
                            description: response.payslip.payslipItems[i].description,
                            accrualDate: response.payslip.payslipItems[i].accrualDate,
                            total: lx.util.formatCurrency(response.payslip.payslipItems[i].total)
                            
                        });
                    }
                    
                    // Is it an income item?
                    if (response.payslip.payslipItems[i].payslipCategoryCode === 'ALLO') {
                        // Add the item to the earnings array
                        allowances.push({
                            id: response.payslip.payslipItems[i].id,
                            description: response.payslip.payslipItems[i].description,
                            accrualDate: response.payslip.payslipItems[i].accrualDate,
                            total: lx.util.formatCurrency(response.payslip.payslipItems[i].total)
                            
                        });
                    }
                }
                
                // NOTE: This hides the grids that aren't used 
                // Could be used later
                // if (earnings.length === 0) {
                //     earningsContainer.style.display = 'none';
                // }
                // if (companyContributions.length === 0) {
                //     companyContributionsContainer.style.display = 'none';
                // }
                // if (fringeBenefits.length === 0) {
                //     fringeBenefitsContainer.style.display = 'none';
                // }
                // if (allowances.length === 0) {
                //     allowancesContainer.style.display = 'none';
                // }
                
                earningsGrid.clear();
                earningsGrid.addRows(earnings);
                deductionsGrid.clear();
                deductionsGrid.addRows(deductions);
                companyContributionsGrid.clear();
                companyContributionsGrid.addRows(companyContributions);
                fringeBenefitsGrid.clear();
                fringeBenefitsGrid.addRows(fringeBenefits);
                allowancesGrid.clear();
                allowancesGrid.addRows(allowances);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            payslipId: null
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
        payslipId = compConfig.payslipId;
        
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
            innerHTML: '<i class="fa fa-fw fa-scroll" style="margin: 0px 15px 0px 0px;"></i>View Payslip: ' + config.employeeName
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
        
        // create periodEl element
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
        
        // Create the downloadButtonlabelEl component
        downloadButtonlabelEl = lx.createElement('DIV', {
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
        // EARNINGS SECTION
        //
        
        earningsContainer = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        earningsDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: earningsContainer,
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
        
        earningsDetailsHeadingEl = lx.createElement('DIV', {
            parent: earningsDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Earnings</div>'
        });
        
        earningsDetailsSectionEl = lx.createElement('DIV', {
            parent: earningsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        earningsGrid = new lx.component.Grid({
            renderTo: earningsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '120px'}
            ]
        });
        
        
        //
        // DEDUCTIONS SECTION
        //
        
        deductionsContainer = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        deductionsDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: deductionsContainer,
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
            parent: deductionsDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Deductions</div>'
        });
        
        deductionsDetailsSectionEl = lx.createElement('DIV', {
            parent: deductionsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
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
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '120px'}
            ]
        });
        
        
        //
        // COMPANY CONTRIBUTIONS SECTION
        //
        
        companyContributionsContainer = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        companyContributionsDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: companyContributionsContainer,
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
        
        companyContributionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: companyContributionsDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Company Contributions</div>'
        });
        
        companyContributionsDetailsSectionEl = lx.createElement('DIV', {
            parent: companyContributionsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        companyContributionsGrid = new lx.component.Grid({
            renderTo: companyContributionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '120px'}
            ]
        });
        
        
        //
        // FRINGE BENEFITS SECTION
        //
        
        fringeBenefitsContainer = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        fringeBenefitsDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: fringeBenefitsContainer,
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
        
        fringeBenefitsDetailsHeadingEl = lx.createElement('DIV', {
            parent: fringeBenefitsDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Fringe Benefits</div>'
        });
        
        fringeBenefitsDetailsSectionEl = lx.createElement('DIV', {
            parent: fringeBenefitsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        fringeBenefitsGrid = new lx.component.Grid({
            renderTo: fringeBenefitsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '120px'}
            ]
        });
        
        
        //
        // ALLOWANCES SECTION
        //
        
        allowancesContainer = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        allowancesDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: allowancesContainer,
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
        
        allowancesDetailsHeadingEl = lx.createElement('DIV', {
            parent: allowancesDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Allowances</div>'
        });
        
        allowancesDetailsSectionEl = lx.createElement('DIV', {
            parent: allowancesContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        allowancesGrid = new lx.component.Grid({
            renderTo: allowancesDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '120px'}
            ]
        });
        
        // Load form data
        loader.show(false);
        loadPayslip();
        
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
        if( isSendingPayslip ) {
            return;
        }
        
        isSendingPayslip = true;
        app.applyStyle(emailButtonBackgroundEl, {backgroundColor: '#666666'});
        
        
        // Add the payslip to the list
        let emailData = [];
        emailData.push({
            id: config.payslipId
        });
        
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=sendPayslips',
            data: {
                emailData: emailData
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                isSendingPayslip = false;
                app.applyStyle(emailButtonBackgroundEl, {backgroundColor: lx.style.global.highlightColor});
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Sending Payslip Failed',
                        message: response.error
                    });
                    return; 
                }
                
                new lx.component.Messagebox({
                    title: 'Send Payslip',
                    message: 'The payslip was successfully sent to your email address.'
                });
            }
        });
    }
    
    // downloadBtn click event handler
    function downloadBtnClickEventHandler() {
        lx.sendForm({
            url: 'exec.php?c=Payslip&fn=downloadPayslip',
            target: '_blank',
            data: {
                payslipId: config.payslipId
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