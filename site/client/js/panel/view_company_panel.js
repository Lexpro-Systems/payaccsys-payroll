/* jslint node: true */
/* globals lx, app */
'use strict';


// EXAMPLE PANEL
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
app.panel.ViewCompany = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var companyDetailsSectionEl = null;
    var companyDetailsEditBtn = null;
    var companyNameDisplay = null;
    var companyAliasDisplay = null;
    var companyRegistrationDisplay = null;
    
    var addressSectionEl = null;
    var physicalAddressDisplay = null;
    var postalAddressDisplay = null;
    
    var contactDetailsSectionEl = null;
    var emailAddressDisplay = null;
    var telNumberDisplay = null;
    var faxNumberDisplay = null;
    
    var taxSectionEl = null;
    var payeReferenceDisplay = null;
    var sdlPaymentReferenceDisplay = null;
    var uifPaymentReferenceDisplay = null;
    var uifRegistrationNumberDisplay = null;
    var standardIndustryClassificationDisplay = null;
    var employmentTaxIncentiveDisplay = null;
    var specialEconomicZoneDisplay = null;
    var diplomaticIndemnityDisplay = null;
    
    var sarsContactSectionEl = null;
    var sarsContactFirstNameTxt = null;
    var sarsContactLastNameTxt = null;
    var sarsContactEmailTxt = null;
    var sarsContactBusinessNumberTxt = null;
    var sarsContactCellNumberTxt = null;
    
    var uifContactSectionEl = null;
    var uifContactNameTxt = null;
    var uifContactEmailTxt = null;
    var uifContactNumberTxt = null;
    
    var bankAccountsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load company details
    function loadCompanyDetails() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                companyNameDisplay.setValue(response.company.details.name);
                companyAliasDisplay.setValue(response.company.details.alias);
                companyRegistrationDisplay.setValue(response.company.details.registrationNumber);
                
                
                // Set physical address details
                var value = '';
                if( response.company.details.physicalAddressUnit !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressUnit;
                }
                if( response.company.details.physicalAddressComplex !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressComplex;
                }
                if( response.company.details.physicalAddressStreet !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressStreet;
                }
                if( response.company.details.physicalAddressSuburb !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressSuburb;
                }
                if( response.company.details.physicalAddressCity !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressCity;
                }
                if( response.company.details.physicalAddressPostalCode !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressPostalCode;
                }
                if( response.company.details.physicalAddressCountryName !== null ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.physicalAddressCountryName;
                }
                
                if( value === '' ) value = '-';
                physicalAddressDisplay.setValue( value );
                
                // Set postal address details
                value = '';
                if( response.company.details.postalAddressLine1 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.postalAddressLine1;
                }
                if( response.company.details.postalAddressLine2 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.postalAddressLine2;
                }
                if( response.company.details.postalAddressLine3 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.postalAddressLine3;
                }
                if( response.company.details.postalAddressCode !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.details.postalAddressCode;
                }
                
                if( value === '' ) value = '-';
                postalAddressDisplay.setValue( value );
                
                if( response.company.details.emailAddress !== '' ) {
                    emailAddressDisplay.setValue( response.company.details.emailAddress );
                }
                else {
                    emailAddressDisplay.setValue( '-' );
                }
                
                if( response.company.details.telNumber !== '' ) {
                    telNumberDisplay.setValue( response.company.details.telNumber );
                }
                else {
                    telNumberDisplay.setValue( '-' );
                }
                
                if( response.company.details.faxNumber !== '' ) {
                    faxNumberDisplay.setValue( response.company.details.faxNumber );
                }
                else {
                    faxNumberDisplay.setValue( '-' );
                }
                
                payeReferenceDisplay.setValue(response.company.details.payeReferenceNumber);
                sdlPaymentReferenceDisplay.setValue(response.company.details.sdlPaymentReferenceNumber);
                uifPaymentReferenceDisplay.setValue(response.company.details.uifPaymentReferenceNumber);
                uifRegistrationNumberDisplay.setValue(response.company.details.uifRegistrationNumber);
                standardIndustryClassificationDisplay.setValue(response.company.details.sicName);
                employmentTaxIncentiveDisplay.setValue(response.company.details.etiStatusName);
                
                if (response.company.details.specialEconomicZoneCode === null || response.company.details.specialEconomicZoneCode === '') {
                    specialEconomicZoneDisplay.setValue('None');
                }
                else {
                    specialEconomicZoneDisplay.setValue(response.company.details.specialEconomicZoneName);
                }
                
                var indemnity = 'No';
                if (response.company.details.diplomaticIndemnity) {
                    indemnity = 'Yes';
                }
                diplomaticIndemnityDisplay.setValue(indemnity);
                sarsContactFirstNameTxt.setValue(response.company.details.sarsContactFirstName);
                sarsContactLastNameTxt.setValue(response.company.details.sarsContactLastName);
                sarsContactEmailTxt.setValue(response.company.details.sarsContactEmailAddress);
                sarsContactBusinessNumberTxt.setValue(response.company.details.sarsContactBusinessNumber);
                sarsContactCellNumberTxt.setValue(response.company.details.sarsContactCellNumber);
                uifContactNameTxt.setValue(response.company.details.uifContactPerson);
                uifContactEmailTxt.setValue(response.company.details.uifContactEmailAddress);
                uifContactNumberTxt.setValue(response.company.details.uifContactNumber);
                
                
                loader.hide();
            }
        });
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getBankList',
            data: {
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                var accounts = [];
                for( var i = 0; i < response.accounts.length; i++ ) {
                    accounts.push({
                        id: response.accounts[i].id,
                        bankName: response.accounts[i].financialInstitutionName,
                        bankType: response.accounts[i].bankAccountTypeName,
                        accountNumber: response.accounts[i].accountNumber,
                        branchCode: response.accounts[i].branchCode,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                bankAccountsGrid.addRows( accounts );
                
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
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Company'
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
        
        // Create the company details heading element
        var companyDetailsHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Company Details</div>'
        });
        
        // Create companyDetailsEditBtn component
        companyDetailsEditBtn = new lx.component.Button({
            renderTo: companyDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: companyDetailsEditBtnClickEventhandler
        });
        
        companyDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the company name display component
        companyNameDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Name:',
            labelWidth: '230px'
        });
        
        // Create the company name display component
        companyAliasDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Alias:',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the company name display component
        companyRegistrationDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Registration Number:',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // ADDRESS SECTION
        //
        
        // Create the address heading element
        var addressHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Address Details</div>'
        });
        
        // Create addressEditBtn component
        new lx.component.Button({
            renderTo: addressHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: addressDetailsEditBtnClickEventhandler
        });
        
        // Create address section element
        addressSectionEl = lx.createElement('DIV', {
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
        
        // Create the physicalAddressDisplay
        physicalAddressDisplay = new lx.component.Display({
            renderTo: addressSectionEl,
            label: 'Physical Address:',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the postalAddressDisplay
        postalAddressDisplay = new lx.component.Display({
            renderTo: addressSectionEl,
            label: 'Postal Address:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // CONTACT DETAILS SECTION
        //
        
        // Create the address heading element
        var contactDetailsHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Contact Details</div>'
        });
        
        // Create addressEditBtn component
        new lx.component.Button({
            renderTo: contactDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: contactDetailsEditBtnClickEventhandler
        });
        
        // Create contact details section element
        contactDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the emailAddressDisplay
        emailAddressDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            label: 'Email Address:',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the telNumberDisplay
        telNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            label: 'Telephone Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the faxNumberDisplay
        faxNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            label: 'Fax Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // TAX SECTION
        //
        
        // Create the taxHeadingEl element
        var taxHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Tax Details</div>'
        });
        
        new lx.component.Button({
            renderTo: taxHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: companyTaxDetailsEditBtnClickEventhandler
        });
        
        // Create tax section element
        taxSectionEl = lx.createElement('DIV', {
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
        
        // Create the payeReferenceDisplay component
        payeReferenceDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'PAYE Reference Number:',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the sdlPaymentReferenceDisplay component
        sdlPaymentReferenceDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'SDL Payment Reference Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the uifPaymentReferenceDisplay component
        uifPaymentReferenceDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'UIF Payment Reference Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the uifRegistrationNumberDisplay component
        uifRegistrationNumberDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'UIF Registration Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the standardIndustryClassificationDisplay component
        standardIndustryClassificationDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'Standard Industry Classification:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the employmentTaxIncentiveDisplay component
        employmentTaxIncentiveDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'Employment Tax Incentive:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the specialEconomicZoneDisplay component
        specialEconomicZoneDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'Special Economic Zone:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the diplomaticIndemnityDisplay component
        diplomaticIndemnityDisplay = new lx.component.Display({
            renderTo: taxSectionEl,
            label: 'Diplomatic Indemnity:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // SARS CONTACT SECTION
        //
        
        // Create the taxHeadingEl element
        var sarsContactHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>SARS Contact Person</div>'
        });
        
        new lx.component.Button({
            renderTo: sarsContactHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: companySarsContactDetailsEditBtnClickEventhandler
        });
        
        // Create SARS contact section element
        sarsContactSectionEl = lx.createElement('DIV', {
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
        
        // Create the sarsContactFirstNameTxt
        sarsContactFirstNameTxt = new lx.component.Display({
            renderTo: sarsContactSectionEl,
            label: 'First Name:',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the sarsContactLastNameTxt
        sarsContactLastNameTxt = new lx.component.Display({
            renderTo: sarsContactSectionEl,
            label: 'Last Name:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the sarsContactEmailTxt
        sarsContactEmailTxt = new lx.component.Display({
            renderTo: sarsContactSectionEl,
            label: 'Email Address:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the sarsContactBusinessNumber
        sarsContactBusinessNumberTxt = new lx.component.Display({
            renderTo: sarsContactSectionEl,
            label: 'Contact Business Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the sarsContactCellNumber
        sarsContactCellNumberTxt = new lx.component.Display({
            renderTo: sarsContactSectionEl,
            label: 'Contact Cell Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // UIF CONTACT SECTION
        //
        
        // Create the taxHeadingEl element
        var uifContactHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>UIF Contact Person</div>'
        });
        
        new lx.component.Button({
            renderTo: uifContactHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: companyUifContactDetailsEditBtnClickEventhandler
        });
        
        // Create UIF contact section element
        uifContactSectionEl = lx.createElement('DIV', {
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
        
        // Create the uifContactNameTxt
        uifContactNameTxt = new lx.component.Display({
            renderTo: uifContactSectionEl,
            label: 'Name:',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the uifContactEmailTxt
        uifContactEmailTxt = new lx.component.Display({
            renderTo: uifContactSectionEl,
            label: 'Email Address:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the uifContactNumberTxt
        uifContactNumberTxt = new lx.component.Display({
            renderTo: uifContactSectionEl,
            label: 'Contact Number:',
            labelWidth: '230px',
            margin: '15px 0px 0px 0px'
        });
        
        //
        // BANK ACCOUNT SECTION
        //
        
        // Create the taxHeadingEl element
        var bankAccountHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Banking Details</div>'
        });
        
        new lx.component.Button({
            renderTo: bankAccountHeadingEl,
            label: 'Add',
            style: 'text',
            
            onClick: bankAccountDetailsAddBtnClickEventhandler
        });
        
        // Create UIF contact section element
        var bankAccountSection = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                // padding: '15px',
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // Create bankAccountsGridMenuOptions array
        var bankAccountsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'},
        ];
        
        // Create bankAccountsGrid component
        bankAccountsGrid = new lx.component.Grid({
            renderTo: bankAccountSection,
            width: '100%',
            height: '200px',
            
            columns: [
                {dataIndex: 'accountNumber', name: 'Account Number', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'bankName', name: 'Bank Name',  width: '150px'},
                {dataIndex: 'bankType', name: 'Bank Type',  width: '150px'},
                {dataIndex: 'branchCode', name: 'Branch Code', width: '110px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: bankAccountsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: bankAccountsGridCellClickEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    // Create a modal window
                    var editCompanyBankAccountModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '430px',
                        maxHeight: '417px'
                    });
                    
                    // Create the edit editCompanyDetails panel
                    var editCompanyBankAccountPanel = new app.panel.EditCompanyBankAccount({
                        renderTo: editCompanyBankAccountModal.getContainer(),
                        show: true,
                        companyBankAccountId: bankAccountsGrid.getRow(clickEvent.rowIndex).id,
                        
                        onCancel: function() {
                            app.route.popState();
                        },
                        onSave: function() {
                            app.route.popState();
                            bankAccountsGrid.clear();
                            loadCompanyDetails();
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    editCompanyBankAccountModal.addEventListener('destroy', function() {
                        editCompanyBankAccountPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    var state = {
                        modal: editCompanyBankAccountModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    editCompanyBankAccountModal.show();
                    editCompanyBankAccountPanel.focus();
                }
                else if(clickEvent.value === 'remove'){
                    
                    new lx.component.Messagebox({
                        message: 
                            'Are you sure you want to remove the \'' + bankAccountsGrid.getRow(clickEvent.rowIndex).bankName + '\' account' ,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the department be removed?
                            if( closeEvent.button === 'remove' ) {
                                // Delete the department
                                lx.sendJSON({
                                    url: 'exec.php?c=Company&fn=removeBank',
                                    data: {
                                        companyBankAccountId: parseInt(bankAccountsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Department Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        bankAccountsGrid.clear();
                                        loadCompanyDetails();
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
        
        // Load company details.
        loadCompanyDetails();
        
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
    
    function bankAccountsGridCellClickEventHandler( event ) {
        if( event.columnIndex === 0 ) {
            // Create a modal window
            var editCompanyBankAccountModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '430px',
                maxHeight: '417px'
            });
            
            // Create the edit editCompanyDetails panel
            var editCompanyBankAccountPanel = new app.panel.EditCompanyBankAccount({
                renderTo: editCompanyBankAccountModal.getContainer(),
                show: true,
                companyBankAccountId: event.record.id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    bankAccountsGrid.clear();
                    loadCompanyDetails();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editCompanyBankAccountModal.addEventListener('destroy', function() {
                editCompanyBankAccountPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editCompanyBankAccountModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            editCompanyBankAccountModal.show();
            editCompanyBankAccountPanel.focus();
        }
    }
    
    function companyUifContactDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editCompanyDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '364px'
        });
        
        // Create the edit editCompanyDetails panel
        var editCompanyDetailsPanel = new app.panel.EditCompanyUifContactDetails({
            renderTo: editCompanyDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editCompanyDetailsModal.addEventListener('destroy', function() {
            editCompanyDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editCompanyDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editCompanyDetailsModal.show();
        editCompanyDetailsPanel.focus();
    }
    
    function companySarsContactDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editCompanyDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '497px'
        });
        
        // Create the edit editCompanyDetails panel
        var editCompanyDetailsPanel = new app.panel.EditCompanySarsContactDetails({
            renderTo: editCompanyDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editCompanyDetailsModal.addEventListener('destroy', function() {
            editCompanyDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editCompanyDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editCompanyDetailsModal.show();
        editCompanyDetailsPanel.focus();
    }
    
    function addressDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editAddressDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '995px',
        });
        
        // Create the edit editCompanyDetails panel
        var editAddressDetailsPanel = new app.panel.EditCompanyAddressDetails({
            renderTo: editAddressDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editAddressDetailsModal.addEventListener('destroy', function() {
            editAddressDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editAddressDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editAddressDetailsModal.show();
        editAddressDetailsPanel.focus();
    }
    
    function contactDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editCompanyDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '364px'
        });
        
        // Create the editCompanyDetails panel
        var editCompanyDetailsPanel = new app.panel.EditCompanyContactDetails({
            renderTo: editCompanyDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editCompanyDetailsModal.addEventListener('destroy', function() {
            editCompanyDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editCompanyDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editCompanyDetailsModal.show();
        editCompanyDetailsPanel.focus();
    }
    
    function companyTaxDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editCompanyDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '500px'
        });
        
        // Create the edit editCompanyDetails panel
        var editCompanyDetailsPanel = new app.panel.EditCompanyTaxDetails({
            renderTo: editCompanyDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editCompanyDetailsModal.addEventListener('destroy', function() {
            editCompanyDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editCompanyDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editCompanyDetailsModal.show();
        editCompanyDetailsPanel.focus();
    }
    
    // companyDetailsEditBtn click event handler
    function companyDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editCompanyDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '364px'
        });
        
        // Create the edit editCompanyDetails panel
        var editCompanyDetailsPanel = new app.panel.EditCompanyDetails({
            renderTo: editCompanyDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editCompanyDetailsModal.addEventListener('destroy', function() {
            editCompanyDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editCompanyDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editCompanyDetailsModal.show();
        editCompanyDetailsPanel.focus();
    }
    
    function bankAccountDetailsAddBtnClickEventhandler() {
        // Create a modal window
        var addCompanyBankAccountModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '417px'
        });
        
        // Create the edit editCompanyDetails panel
        var addCompanyBankAccountPanel = new app.panel.AddCompanyBankAccount({
            renderTo: addCompanyBankAccountModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onAdd: function() {
                app.route.popState();
                bankAccountsGrid.clear();
                loadCompanyDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addCompanyBankAccountModal.addEventListener('destroy', function() {
            addCompanyBankAccountPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addCompanyBankAccountModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addCompanyBankAccountModal.show();
        addCompanyBankAccountPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};