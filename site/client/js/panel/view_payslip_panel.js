/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW PAYSLIP PANEL
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
app.panel.ViewPayslip = function(config) {
    
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
    
    var payslipDetailsHeading = null;
    var payslipDetailsSectionEl = null;
    var fromDateDisplay = null;
    var toDateDisplay = null;
    var sarsYearDisplay = null;
    var payrunDisplay = null;
    
    var earningsContainer = null;
    var earningsDetailsHeadingEl = null;
    var earningsDetailsSectionEl = null;
    var earningsGrid = null;
    
    var deductionsContainer = null;
    var deductionsDetailsHeadingEl = null;
    var deductionsDetailsSectionEl = null;
    var deductionsGrid = null;
    
    var companyContributionsContainer = null;
    var companyContributionsDetailsHeadingEl = null;
    var companyContributionsDetailsSectionEl = null;
    var companyContributionsGrid = null;
    
    var fringeBenefitsContainer = null;
    var fringeBenefitsDetailsHeadingEl = null;
    var fringeBenefitsDetailsSectionEl = null;
    var fringeBenefitsGrid = null;
    
    var allowancesContainer = null;
    var allowancesDetailsHeadingEl = null;
    var allowancesDetailsSectionEl = null;
    var allowancesGrid = null;
    
    var netSalaryDetailsHeadingEl = null;
    var netSalaryDetailsSectionEl = null;
    var netSalaryDisplay = null;
    
    var payslipId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load users
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
                
                fromDateDisplay.setValue(response.payslip.payslipDetails.fromDate);
                toDateDisplay.setValue(response.payslip.payslipDetails.toDate);
                sarsYearDisplay.setValue(response.payslip.payslipDetails.sarsYear);
                payrunDisplay.setValue(response.payslip.payslipDetails.description);
                
                // For every paylsip item
                let earnings = [];
                let deductions = [];
                let companyContributions = [];
                let fringeBenefits = [];
                let allowances = [];
                for( var i = 0; i < response.payslip.payslipItems.length; i++ ) {
                    // Add the item to the earnings array
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
                
                netSalaryDisplay.setValue(lx.util.formatCurrency(response.payslip.netSalaryTotal));
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
        confirmDestroy = false;
        payslipId = compConfig.payslipId;
        
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
            innerHTML: 'View Employee Payslip: ' + config.employeeName
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
        // COMPANY DETAILS SECTION
        //
        
        // Create the payslipDetailsHeading element
        payslipDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Payslip Details</div>'
        });
        
        // Create the payslipDetailsSectionEl
        payslipDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the fromDateDisplay component
        fromDateDisplay = new lx.component.Display({
            renderTo: payslipDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'From Date',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the toDateDisplay component
        toDateDisplay = new lx.component.Display({
            renderTo: payslipDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'To Date',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the sarsYearDisplay component
        sarsYearDisplay = new lx.component.Display({
            renderTo: payslipDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'SARS Year',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the payrunDisplay component
        payrunDisplay = new lx.component.Display({
            renderTo: payslipDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Payrun',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        
        //
        // EARNINGS SECTION
        //
        
        earningsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        earningsDetailsHeadingEl = lx.createElement('DIV', {
            parent: earningsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Earnings</div>'
        });
        
        earningsDetailsSectionEl = lx.createElement('DIV', {
            parent: earningsContainer,
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
        
        earningsGrid = new lx.component.Grid({
            renderTo: earningsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '100px'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '130px'}
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
                padding: '20px 15px 15px 15px',
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
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '100px'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // COMPANY CONTRIBUTIONS SECTION
        //
        
        companyContributionsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        companyContributionsDetailsHeadingEl = lx.createElement('DIV', {
            parent: companyContributionsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Company Contributions</div>'
        });
        
        companyContributionsDetailsSectionEl = lx.createElement('DIV', {
            parent: companyContributionsContainer,
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
        
        companyContributionsGrid = new lx.component.Grid({
            renderTo: companyContributionsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '100px'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // FRINGE BENEFITS SECTION
        //
        
        fringeBenefitsContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        fringeBenefitsDetailsHeadingEl = lx.createElement('DIV', {
            parent: fringeBenefitsContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Fringe Benefits</div>'
        });
        
        fringeBenefitsDetailsSectionEl = lx.createElement('DIV', {
            parent: fringeBenefitsContainer,
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
        
        fringeBenefitsGrid = new lx.component.Grid({
            renderTo: fringeBenefitsDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '100px'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '130px'}
            ]
        });
        
        
        //
        // ALLOWANCES SECTION
        //
        
        allowancesContainer = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        allowancesDetailsHeadingEl = lx.createElement('DIV', {
            parent: allowancesContainer,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Allowances</div>'
        });
        
        allowancesDetailsSectionEl = lx.createElement('DIV', {
            parent: allowancesContainer,
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
        
        allowancesGrid = new lx.component.Grid({
            renderTo: allowancesDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '100px'},
                {dataIndex: 'total', name: 'Total', alignment: 'right', width: '130px'}
            ]
        });
        
        
        netSalaryDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '20px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Nett Salary</div>'
        });
        
        netSalaryDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the fromDateDisplay component
        netSalaryDisplay = new lx.component.Display({
            renderTo: netSalaryDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Total:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Load form data
        loader.show(false);
        loadPayslip();
        
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
            payslipId: config.payslipId,
            emailAddress: config.emailAddress,
            
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
        config.viewEmployeePanel.show();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};