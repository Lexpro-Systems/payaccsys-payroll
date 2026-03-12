/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW TAX RECONCILIATION DETAILS PANEL
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
app.panel.ViewTaxReconciliationDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var reconciliationDetailsHeadingEl = null;
    // var reconciliationDetailsEditBtn = null;
    var reconciliationDetailsSectionEl = null;
    var generatedOnDisplay = null;
    var taxYearDisplay = null;
    var periodDisplay = null;
    var noteDisplay = null;
    
    
    var employerDetailsHeadingEl = null;
    // var employerDetailsEditBtn = null;
    var employerDetailsSectionEl = null;
    var employerNameDisplay = null;
    var employerPayeNumberDisplay = null;
    var employerSdlNumberDisplay = null;
    var employerUifNumberDisplay = null;
    var employerSicNameDisplay = null;
    var employerEtiStatusNameDisplay = null;
    var employerSpecialEconomicZoneNameDisplay = null;
    var employerDiplomaticIndemnityDisplay = null;
    var employerAddressDisplay = null;
    
    var contactPersonDetailsHeadingEl = null;
    // var contactPersonDetailsEditBtn = null;
    var contactPersonDetailsSectionEl = null;
    var firstNameDisplay = null;
    var lastNameDisplay = null;
    var businessNumberDisplay = null;
    var cellNumberDisplay = null;
    var emailAddressDisplay = null;
    
    var reconciliationId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadEmployee() {
        loader.show( false );
        lx.sendJSON({
            url: 'exec.php?c=TaxReconciliation&fn=get',
            data: {
                reconciliationId: reconciliationId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Reconciliation Failed',
                        message: response.error
                    });
                }
                
                // Set the reconciliation details
                generatedOnDisplay.setValue( response.reconciliation.generatedOn );
                taxYearDisplay.setValue( (response.reconciliation.sarsYear - 1) + ' / ' + response.reconciliation.sarsYear );
                periodDisplay.setValue( response.reconciliation.periodName );
                
                var value = '-';
                if( response.reconciliation.note !== '' ) { value  = response.reconciliation.note; }
                noteDisplay.setValue( value );
                
                // Set the employer details
                employerNameDisplay.setValue( response.reconciliation.employer.name );
                
                value = '-';
                if( response.reconciliation.employer.payeNumber !== '' ) { value  = response.reconciliation.employer.payeNumber; }
                employerPayeNumberDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.employer.sdlNumber !== '' ) { value  = response.reconciliation.employer.sdlNumber; }
                employerSdlNumberDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.employer.uifNumber !== '' ) { value  = response.reconciliation.employer.uifNumber; }
                employerUifNumberDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.employer.sicName !== null ) { value  = response.reconciliation.employer.sicName; }
                employerSicNameDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.employer.etiStatusName !== null ) { value  = response.reconciliation.employer.etiStatusName; }
                employerEtiStatusNameDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.employer.specialEconomicZoneName !== null ) { value  = response.reconciliation.employer.specialEconomicZoneName; }
                employerSpecialEconomicZoneNameDisplay.setValue( value );
                
                value = 'No';
                if( response.reconciliation.employer.diplomaticIndemnity ) {
                    value = 'Yes';
                }
                employerDiplomaticIndemnityDisplay.setValue( value );
                
                value = '';
                if( response.reconciliation.employer.address.unit !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.unit;
                }
                if( response.reconciliation.employer.address.complex !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.complex;
                }
                if( response.reconciliation.employer.address.streetName !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    if( response.reconciliation.employer.address.streetNumber !== '' ) {
                        value = value + response.reconciliation.employer.address.streetNumber + ' ';
                    }
                    value = value + response.reconciliation.employer.address.streetName;
                }
                if( response.reconciliation.employer.address.suburb !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.suburb;
                }
                if( response.reconciliation.employer.address.city !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.city;
                }
                if( response.reconciliation.employer.address.postalCode !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.postalCode;
                }
                if( response.reconciliation.employer.address.countryName !== null ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.reconciliation.employer.address.countryName;
                }
                employerAddressDisplay.setValue( value );
                
                // Set the contact person details
                value = '-';
                if( response.reconciliation.contactPerson.firstName !== '' ) { value  = response.reconciliation.contactPerson.firstName; }
                firstNameDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.contactPerson.lastName !== '' ) { value  = response.reconciliation.contactPerson.lastName; }
                lastNameDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.contactPerson.telNumber !== '' ) { value  = response.reconciliation.contactPerson.telNumber; }
                businessNumberDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.contactPerson.cellNumber !== '' ) { value  = response.reconciliation.contactPerson.cellNumber; }
                cellNumberDisplay.setValue( value );
                
                value = '-';
                if( response.reconciliation.contactPerson.emailAddress !== '' ) { value  = response.reconciliation.contactPerson.emailAddress; }
                emailAddressDisplay.setValue( value );
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
            
            reconciliationId: null
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
        reconciliationId = compConfig.reconciliationId;
        
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
        
        // Create the reconciliationDetailsHeadingEl element
        reconciliationDetailsHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Reconciliation Details</div>'
        });
        
        // Create reconciliationDetailsEditBtn component
        // reconciliationDetailsEditBtn = new lx.component.Button({
        //     renderTo: reconciliationDetailsHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: reconciliationDetailsEditBtnClickEventhandler
        // });
        
        // Create the reconciliationDetailsSectionEl element
        reconciliationDetailsSectionEl = lx.createElement('DIV', {
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
        
        generatedOnDisplay = new lx.component.Display({
            renderTo: reconciliationDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Generated On:',
            labelWidth: '230px'
        });
        
        taxYearDisplay = new lx.component.Display({
            renderTo: reconciliationDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Tax Year:',
            labelWidth: '230px'
        });
        
        periodDisplay = new lx.component.Display({
            renderTo: reconciliationDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Period:',
            labelWidth: '230px'
        });
        
        noteDisplay = new lx.component.Display({
            renderTo: reconciliationDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Note:',
            labelWidth: '230px'
        });
        
        
        //
        // EMPLOYER DETAILS SECTION
        //
        
        // Create the employerDetailsHeadingEl element
        employerDetailsHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employer Details</div>'
        });
        
        // Create employerDetailsEditBtn component
        // employerDetailsEditBtn = new lx.component.Button({
        //     renderTo: employerDetailsHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: employerDetailsEditBtnClickEventhandler
        // });
        
        // Create the employerDetailsSectionEl element
        employerDetailsSectionEl = lx.createElement('DIV', {
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
        
        employerNameDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name:',
            labelWidth: '230px'
        });
        
        employerSicNameDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'SIC Code:',
            labelWidth: '230px'
        });
        
        employerPayeNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'PAYE Number:',
            labelWidth: '230px'
        });
        
        employerSdlNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'SDL Number:',
            labelWidth: '230px'
        });
        
        employerUifNumberDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'UIF Number',
            labelWidth: '230px'
        });
        
        employerEtiStatusNameDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'ETI Status:',
            labelWidth: '230px'
        });
        
        employerSpecialEconomicZoneNameDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Special Economic Zone:',
            labelWidth: '230px'
        });
        
        employerDiplomaticIndemnityDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Diplomatic Indemnity:',
            labelWidth: '230px'
        });
        
        employerAddressDisplay = new lx.component.Display({
            renderTo: employerDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Physical Address:',
            labelWidth: '230px'
        });
            
        //
        // SARS CONTACT PERSON DETAILS SECTION
        //
        
        // Create the contactPersonDetailsHeadingEl element
        contactPersonDetailsHeadingEl = lx.createElement('DIV', {
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
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>SARS Contact Person Details</div>'
        });
        
        // Create employerDetailsEditBtn component
        // contactPersonDetailsEditBtn = new lx.component.Button({
        //     renderTo: contactPersonDetailsHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: contactPersonDetailsEditBtnClickEventhandler
        // });
        
        // Create the employerDetailsSectionEl element
        contactPersonDetailsSectionEl = lx.createElement('DIV', {
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
        
        firstNameDisplay = new lx.component.Display({
            renderTo: contactPersonDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'First Name:',
            labelWidth: '230px'
        });
        
        lastNameDisplay = new lx.component.Display({
            renderTo: contactPersonDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Last Name:',
            labelWidth: '230px'
        });
        
        businessNumberDisplay = new lx.component.Display({
            renderTo: contactPersonDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Business Number:',
            labelWidth: '230px'
        });
        
        cellNumberDisplay = new lx.component.Display({
            renderTo: contactPersonDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Cell Number:',
            labelWidth: '230px'
        });
        
        emailAddressDisplay = new lx.component.Display({
            renderTo: contactPersonDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Email Address:',
            labelWidth: '230px'
        });
        
        // Load form data
        loadEmployee();
        
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
    
    // reconciliationDetailsEditBtn click event handler
    // function reconciliationDetailsEditBtnClickEventhandler() {
    // }
    
    // employerDetailsEditBtn click event handler
    // function employerDetailsEditBtnClickEventhandler() {
    // }
    
    // contactPersonDetailsEditBtn click event handler
    // function contactPersonDetailsEditBtnClickEventhandler() {
    // }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};