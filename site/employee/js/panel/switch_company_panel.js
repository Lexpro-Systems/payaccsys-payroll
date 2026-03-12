/* globals app, lx */
'use strict';


// SWITCH COMPANY PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  title               Specify a different title for this panel
//
// Events:
//
//  onCompanySelect     This event is fired when a company is selected from the list.
//  onCancel            This event is fired when the user clicks the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.SwitchCompany = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var companyListEl = null;
    var loader = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadCompanies() {
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getCompanyList',
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok === false ) {
                    new lx.component.Messagebox({
                        title: 'Unable To Load Companies',
                        message: response.error
                    });
                    return;
                }
                
                // Notify the user if no companies were found.
                if( response.companies.length === 0 ) {
                    lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            padding: '15px',
                            fontSize: '16px'
                        },
                        innerHTML: 'No companies available.'
                    });
                }
                
                for( var i = 0 ; i < response.companies.length; i++ ) {
                    var listItemEl = lx.createElement('DIV', {
                        parent: companyListEl,
                        style: {
                            cursor: 'pointer',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: app.panelBackgroundColor,
                            margin: '2px 0px 0px 0px',
                        }
                    });
                    listItemEl.addEventListener('click', listItemElClickEventHandler.bind(this, response.companies[i].id));
                    
                    var listItemDetailContainerEl = lx.createElement('DIV', {
                        parent: listItemEl,
                        className: 'list-item',
                        style: {
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '0px 15px 0px 0px'
                        }
                    });
                    
                    // Create the label element
                    lx.createElement('DIV', {
                        parent: listItemDetailContainerEl,
                        style: {
                            flex: '1 1 100%',
                            padding: '20px 0px 20px 17px',
                            fontSize: '16px',
                        },
                        innerHTML: response.companies[i].name
                    });
                    
                    // Create arrow icon
                    listItemDetailContainerEl.appendChild( lx.icon.create('right_chevron', '#7F7F7F', 20, 1) );
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
            title: '<i class="fa fa-fw fa-exchange-alt" style="margin: 0px 15px 0px 0px;"></i>Switch Company'
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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%'
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
                borderColor: app.panelBackgroundColor
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
                backgroundColor: app.panelBackgroundColor,
                padding: '10px',
                zIndex: 0
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: companyListEl
        });
        loader.show(false);
        
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
                borderColor: app.panelBackgroundColor
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            width: '120px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Load the list of companies
        loadCompanies();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // listItemEl click event handler
    function listItemElClickEventHandler(companyId) {
        // Switch to selected company
        lx.sendJSON({
            url: 'exec.php?c=User&fn=switchCompany',
            data: {
                companyId: companyId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Switching company failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // We have successfully switched company
                me.fireEvent('companyselect', {srcPanel: me});
            }
        });
    }
    
    // cancelBtn click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};