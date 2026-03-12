/* globals app, lx */
'use strict';


// TAX CERTFICATES PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.TaxCertificates = function(config) {
    
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
    var centeredContainerEl = null;
    
    var certificateDetailsHeadingEl = null;
    var certificatesContainerEl = null;
    var certificatesDetailsMessageEl = null;
    
    let certificateList = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load certificates
    function loadCertificates( clearCertificates ) {
        loader.show( false );
        
        let offset = 0;
        if( !clearCertificates ) offset = certificateList.length;
        
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=getList',
            data: {
                searchString: '',
                limit: 50,
                offset: offset,
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Certificates Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Should all certificates be cleared?
                if( clearCertificates ) {
                    certificatesContainerEl.innerHTML = '';
                    certificateList = [];
                }
                
                // Display a message if there aren't any requests
                if( (response.certificates.length < 1) && clearCertificates ) {
                    // lx.createElement('DIV', {
                    //     parent: certificatesContainerEl,
                    //     style: {
                    //         boxSizing: 'border-box',
                    //         padding: '15px',
                    //         fontSize: '14px',
                    //         color: 'lx.style.global.color',
                    //         backgroundColor: '#FFFFFF',
                    //         width: '100%',
                    //         maxWidth: '900px',
                    //         display: 'block',
                    //         flex: '1 1 100%'
                    //     },
                    //     innerHTML: 'No certificates to display.'
                    // });
                    certificatesDetailsMessageEl.style.display = 'flex';
                    certificatesContainerEl.style.display = 'none';
                    return;
                }
                else {
                    certificatesDetailsMessageEl.style.display = 'none';
                    certificatesContainerEl.style.display = 'flex';
                }
                
                // Create a card for each certificate
                for( let i = 0; i < response.certificates.length; i++ ) {
                    let certificate = response.certificates[i];
                    
                    // Create a new certificate item
                    let certificateItem = {
                        id: certificate.id,
                        employeeName: certificate.employeeName,
                        creationTime: certificate.generatedOn,
                        el: null,
                        taxYearEl: null,
                        numberEl: null,
                        typeEl: null
                    };
                    
                    // Create the card main element
                    certificateItem.el = lx.createElement('DIV', {
                        parent: certificatesContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            margin: '0px 0px 5px 0px',
                            display: 'flex',
                            // flex: '0 0 auto',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            justifyContent: 'space-between',
                            padding: '5px 10px',
                            color: '#7A7A7A',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: (i > 0 ? '1px 0px 0px 0px' : '0px 0px 0px 0px'),
                            borderColor: app.sectionBackgroundColor // lx.style.global.highlightColor,
                        }
                    });
                        
                    // Create the container for the certificate details
                    let certificateDetailsCointainerEl =  lx.createElement('DIV', {
                        parent: certificateItem.el,
                        style: {
                            // cursor: 'pointer',
                            flex: '1 1 100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            margin: '0px 0px 0px 0px'
                        }
                    });
                    
                    // Create the view button
                    let viewCertificateBtnEl =  lx.createElement('DIV', {
                        parent: certificateItem.el,
                        style: {
                            cursor: 'pointer',
                            display: 'flex',
                            width: '30px',
                            minWidth: '30px',
                            height: '30px',
                            minHeight: '30px',
                            margin: 'auto 0px auto 0px',
                            fontSize: '16px',
                            color:  '#FFFFFF',
                            backgroundColor: lx.style.global.highlightColor,
                            borderRadius: '50%'
                        },
                        innerHTML: '<i class="fa fa-chevron-right" style="margin: auto auto;"></i>'
                    });
                    viewCertificateBtnEl.addEventListener('click', certificateItemElClickEventHandler.bind(this, {certificateItem: certificateItem}) );
                    
                    certificateItem.taxYearEl = lx.createElement('DIV', {
                        parent: certificateDetailsCointainerEl,
                        style: {
                            color: lx.style.global.color,
                            fontSize: '14px', // 'calc(12px + 0.25vw)'
                        },
                        innerHTML: 'Tax Year: ' + certificate.taxYear
                    });
                    
                    certificateItem.numberEl = lx.createElement('DIV', {
                        parent: certificateDetailsCointainerEl,
                        style: {
                            fontSize: '12px',
                            margin: '2px 0px 0px 0px'
                        },
                        innerHTML: 'Number: ' + certificate.number
                    });
                    
                    certificateItem.typeEl = lx.createElement('DIV', {
                        parent: certificateDetailsCointainerEl,
                        style: {
                            fontSize: '12px',
                            margin: '2px 0px 0px 0px'
                        },
                        innerHTML: 'Type: ' + certificate.typeName
                    });
                    
                    // Add the item to the certificate list array
                    certificateList.push( certificateItem );
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
                // backgroundColor: app.panelBackgroundColor
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
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
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
            innerHTML: '<i class="fa fa-fw fa-certificate" style="margin: 0px 15px 0px 0px;"></i>Tax Certificates'
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
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px',
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
                maxWidth: '768px',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                margin: '0px auto',
                overflow: 'hidden'
            }
        });
        
        
        //
        // TAX CERTFICATE SECTION
        //
        
        // Create the certificateDetailsContainerEl element
        let certificateDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '768px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Create the certificateDetailsHeadingEl element
        certificateDetailsHeadingEl = lx.createElement('DIV', {
            parent: certificateDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Tax Certificates</div>'
        });
        
        // Create the certificatesContainerEl component
        certificatesContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '10px 15px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        // Create the certificatesDetailsMessageEl element
        certificatesDetailsMessageEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '30px 15px',
                fontSize: '14px',
                color: 'lx.style.global.color',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '0px 1px 1px 1px',
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                width: '100%',
                maxWidth: '900px',
                display: 'none'
            },
            innerHTML: 'No certificates to display.'
        });
        
        // Load the available certificates
        loadCertificates( true );
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        // fromYearFilterSelect.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // certificateItemEl click event handler
    function certificateItemElClickEventHandler( event ) {
        // Make sure taxCertificateId is not null or undefined
        if( typeof event.certificateItem.id === 'undefined' || event.certificateItem.id === null ) return;
        
        me.hide();
        
        let viewCertificatePanel = new app.panel.ViewTaxCertificate({
            renderTo: app.mainPanel.getPanelContainer(),
            taxCertificateId: event.certificateItem.id,
            employeeName: event.certificateItem.employeeName
        });
        
        let panelState = {
            previousPanel: me,
            panel: viewCertificatePanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
        
        viewCertificatePanel.show();
        viewCertificatePanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};