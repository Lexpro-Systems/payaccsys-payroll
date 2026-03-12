/* jslint node: true */
/* globals app, lx */
'use strict';


// TRIAL PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  title               The title to display on the panel.
//
// Events:
//
//  onCompanySelect     This event is fired when a company is selected from the list.
//  onCancel            This event is fired when the user clicks the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.Trial = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var companyListEl = null;
    var loader = null;
    
    var continueBtnContainerEl = null;
    var continueBtn = null;
    var logoutBtnContainerEl = null;
    var logoutBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadTrialDetails() {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getTrialDetails',
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok === false ) {
                    new lx.component.Messagebox({
                        title: 'Unable To Load Trial Details',
                        message: response.error
                    });
                    return;
                }
                
                // Is it not a trial?
                if( response.trialDetails.isTrial === false ) {
                    // Skip this dialog
                    me.fireEvent('continue', {srcPanel: me});
                }
                
                // Setup the consultant details
                let consultantName = null;
                let consultantEmailAddress = 'info@lexpro.co.za';
                let consultantTelNumber = '012 345 4510';
                let consultantCellNumber = null;
                
                if( (response.trialDetails.consultantName !== null) && (response.trialDetails.consultantName.trim() !== '') ) {
                    consultantName = response.trialDetails.consultantName;
                }
                
                if( (response.trialDetails.consultantEmailAddress !== null) && (response.trialDetails.consultantEmailAddress.trim() !== '') ) {
                    consultantEmailAddress = response.trialDetails.consultantEmailAddress;
                }
                
                if( (response.trialDetails.consultantTelNumber !== null) && (response.trialDetails.consultantTelNumber.trim() !== '') ) {
                    consultantTelNumber = response.trialDetails.consultantTelNumber;
                }
                
                if( (response.trialDetails.consultantCellNumber !== null) && (response.trialDetails.consultantCellNumber.trim() !== '') ) {
                    consultantCellNumber = response.trialDetails.consultantCellNumber;
                }
                
                // Display the company name
                new lx.createElement('DIV', {
                    parent: companyListEl,
                    style: {
                        margin: '15px auto 15px auto',
                        maxWidth: '400px',
                        textAlign: 'center',
                        fontSize: '28px',
                        // color:  '#FFFFFF',
                        // backgroundColor: lx.style.global.highlightColor,
                    },
                    innerHTML:  response.trialDetails.companyName
                });
                
                // Has the trial not expired?
                if( response.trialDetails.daysRemaining >= 0 ) {
                    // Show the number of days remaining
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            // cursor: 'pointer',
                            display: 'flex',
                            width: '120px',
                            minWidth: '120px',
                            height: '120px',
                            minHeight: '120px',
                            margin: '30px auto 15px auto',
                            fontSize: '48px',
                            color:  '#FFFFFF',
                            backgroundColor: lx.style.global.highlightColor,
                            borderRadius: '50%'
                        },
                        innerHTML: 
                            '<div style="margin: auto;">' + 
                                response.trialDetails.daysRemaining +
                            '</div>'
                    });
                    
                    // Show the for the number of days remaining
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '0px auto 15px auto',
                            maxWidth: '300px',
                            textAlign: 'center',
                            fontSize: '20px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML:  'Days Remaining In Trial'
                    });
                    
                    // Show a message relating to the trial
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '30px auto 15px auto',
                            maxWidth: '320px',
                            textAlign: 'justify',
                            fontSize: '14px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML: 
                            'Please note that you will not be able to access this company once the trial period has expired. Contact your Lexpro consultant for further enquiries or payment options.'
                    });
                    
                    // Show a message relating to the contact detaols
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '30px auto 0px auto',
                            maxWidth: '320px',
                            textAlign: 'center',
                            fontSize: '14px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML: 
                            '<div style="font-size: 18px; margin: 0px 0px 10px 0px;">Contact Details</div>' +
                            (consultantName !== null ? '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-user" style="margin: 0px 12px 0px 0px; color: #A0A0A0;"></i>' + consultantName + '</div>' : '') +
                            '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-envelope" style="margin: 0px 10px 0px 0px; color: #A0A0A0;"></i><a style="color: ' + lx.style.global.color +'" href="mailto:' + consultantEmailAddress + '">' + consultantEmailAddress + '</a></div>' +
                            '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-phone" style="margin: 0px 10px 0px 0px; color: #A0A0A0;"></i>' + consultantTelNumber + '</div>' +
                            (consultantCellNumber !== null ? '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-mobile" style="margin: 0px 15px 0px 0px; color: #A0A0A0;"></i>' + consultantCellNumber + '</div>' : '')
                    });
                    
                    // Show/hide the relevant buttons
                    continueBtnContainerEl.style.display = 'flex';
                    logoutBtnContainerEl.style.display = 'none';
                    
                    // Activate/deactivate the relevant buttons
                    continueBtn.enable();
                }
                else {
                    // Show the number of days remaining
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            // cursor: 'pointer',
                            display: 'flex',
                            width: '120px',
                            minWidth: '120px',
                            height: '120px',
                            minHeight: '120px',
                            margin: '30px auto 15px auto',
                            fontSize: '48px',
                            color:  '#FFFFFF',
                            backgroundColor: '#E4443C',
                            borderRadius: '50%'
                        },
                        innerHTML: 
                            '<div style="margin: auto;">0</div>'
                    });
                    
                    // Show the for the number of days remaining
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '0px auto 15px auto',
                            maxWidth: '300px',
                            textAlign: 'center',
                            fontSize: '20px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML:  'Days Remaining In Trial'
                    });
                    
                    // Show a message relating to the trial
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '30px auto 15px auto',
                            maxWidth: '320px',
                            textAlign: 'justify',
                            fontSize: '14px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML: 
                            'Please note that the trial period has <span style="color: #E4443C;"><b>EXPIRED</b></span> and that the company is therefore no-longer accessible. Contact your Lexpro consultant for further enquiries or payment options.'
                    });
                    
                    // Show a message relating to the contact detaols
                    new lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            margin: '30px auto 0px auto',
                            maxWidth: '320px',
                            textAlign: 'center',
                            fontSize: '14px',
                            // color:  '#FFFFFF',
                            // backgroundColor: lx.style.global.highlightColor,
                        },
                        innerHTML: 
                            '<div style="font-size: 18px; margin: 0px 0px 10px 0px;">Contact Details</div>' +
                            (consultantName !== null ? '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-user" style="margin: 0px 12px 0px 0px; color: #A0A0A0;"></i>' + consultantName + '</div>' : '') +
                            '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-envelope" style="margin: 0px 10px 0px 0px; color: #A0A0A0;"></i><a style="color: ' + lx.style.global.color +'" href="mailto:' + consultantEmailAddress + '">' + consultantEmailAddress + '</a></div>' +
                            '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-phone" style="margin: 0px 10px 0px 0px; color: #A0A0A0;"></i>' + consultantTelNumber + '</div>' +
                            (consultantCellNumber !== null ? '<div style="text-align: left; margin: 0px 0px 5px 0px;"><i class="fas fa-mobile" style="margin: 0px 15px 0px 0px; color: #A0A0A0;"></i>' + consultantCellNumber + '</div>' : '')
                    });
                    
                    // Show/hide the relevant buttons
                    continueBtnContainerEl.style.display = 'none';
                    logoutBtnContainerEl.style.display = 'flex';
                    
                    // Activate/deactivate the relevant buttons
                    continueBtn.disable();
                }
                
                // Hide the loader
                loader.hide();
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
            title: '<i class="fa fa-fw fa-exchange-alt" style="margin: 0px 15px 0px 0px;"></i>Trial'
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCompanySelect') ) me.addEventListener('companyselect', compConfig.onCompanySelect);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onContinue') ) me.addEventListener('continue', compConfig.onContinue);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '20px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: compConfig.title
        });
        
        // Create the company list element
        companyListEl = lx.createElement('DIV', {
            parent: el,
            style: {
                overflow: 'auto',
                position: 'relative',
                minHeight: '40px',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '10px',
                zIndex: 0
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: companyListEl
        });
        loader.show(false);
        
        // Create the continueBtnContainerEl element
        continueBtnContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'none',
                flexDirection: 'row',
                justifyContent: 'center',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the continueBtn component
        continueBtn = new lx.component.Button({
            renderTo: continueBtnContainerEl,
            label: 'Continue',
            margin: '0px 0px 0px 0px',
            width: '150px',
            
            onClick: continueBtnClickEventHandler
        });
        continueBtn.disable();
        
        // Create the logoutBtnContainerEl element
        logoutBtnContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the logoutBtn component
        logoutBtn = new lx.component.Button({
            renderTo: logoutBtnContainerEl,
            // label: '<i class="fas fa-power-off" style="margin: 0px 10px 0px 0px;"></i>Logout',
            label: 'Logout',
            margin: '0px 0px 0px 0px',
            width: '150px',
            
            onClick: logoutBtnClickEventHandler
        });
        
        // Load the trial details
        loadTrialDetails();
        
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
    
    // logoutBtn click event handler
    function logoutBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // continueBtn click event handler
    function continueBtnClickEventHandler() {
        me.fireEvent('continue', {srcPanel: me, setupComplete: config.setupComplete});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};