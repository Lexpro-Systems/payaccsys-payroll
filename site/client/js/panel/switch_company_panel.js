/* jslint node: true */
/* globals app, lx */
'use strict';


// SWITCH COMPANY PANEL
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
    
    lx.EventEmitter.call(this);
    
    
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
                            borderColor: '#DFDFDF',
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
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,
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
            width: '120px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Load the list of companies
        loadCompanies();
        
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
                me.fireEvent('companyselect', {srcPanel: me, isTrial: response.isTrial, setupComplete: response.setupComplete});
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