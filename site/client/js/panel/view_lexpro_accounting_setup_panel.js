/* globals app, lx */
'use strict';


// VIEW LEAVE PANEL
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
app.panel.ViewLexproAccountingSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Checks if connected to lexpro accounting then loads the config details
    function checkLexproAccountingConnection() {
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=checkConnection',
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                loader.hide();
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to check connection to Lexpro Accounting. ' + result.error
                    });
                }
                
                let connected = result.connected;
                
                // If connected to the lexpro api this gets the config details
                if (connected) {
                    lx.sendJSON({
                        url: 'exec.php?c=LexproAccounting&fn=getLexproAccountingConfig',
                        onSuccess: function( jsonResult ) {
                            var result = JSON.parse(jsonResult);
                            loader.hide();
                            if( result.ok !== true ) {
                                new lx.component.Messagebox({
                                    message: result.error
                                });
                            }
                            
                            // Creates a block for a connected status
                            createApiPanel(connected, result.configComplete , 'Lexpro Accounting', result.configItems);
                        }
                    });
                }
                else {
                    // Creates an empty block for a disconnected status
                    createApiPanel(connected, result.configComplete , 'Lexpro Accounting', []);
                }
            }
        });
    }
    
    // Creates a block for lexpro api
    function createApiPanel(isConnected, configComplete, apiName, configItems) {
        let statusColor = '#45A517';
        let connectButtonName = 'Disconnect';
        let showConfigBnt = false;
        let message = 'Connected to Lexpro Accounting';
        
        // Set all settings for every type of status
        if (!isConnected) {
            statusColor = '#DFDFDF';
            connectButtonName = 'Connect';
            message = 'Disconnected from Lexpro Accounting';
        }
        else if (isConnected && !configComplete) {
            statusColor = '#FA8B42';
            showConfigBnt = true;
            message = 'Lexpro Accounting config is incomplete.';
        }
        
        // Create connectionContainerEl
        let connectionContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
                margin: '20px 0px 0px 0px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
            }
        });
        
        // Create the heading element
        var headingEl = document.createElement('DIV');
        headingEl.className = 'component-flex-row component-flex-align-center';
        headingEl.style.padding = '5px 0px 5px 15px';
        headingEl.style.fontSize = '16px';
        headingEl.style.minHeight = '35px';
        headingEl.style.borderStyle = 'solid';
        headingEl.style.borderColor = '#DFDFDF';
        headingEl.style.borderWidth = '0px 0px 1px 0px';
        headingEl.innerHTML = '<div style="margin: 0px 0px 0px 15px;">' + apiName + '</div>';
        connectionContainerEl.appendChild( headingEl );
        
        // Create the statusEl element
        var statusEl = document.createElement('DIV');
        statusEl.style.width = '10px';
        statusEl.style.height = '10px';
        statusEl.style.borderRadius = '50%';
        statusEl.style.backgroundColor = statusColor;
        headingEl.insertBefore(statusEl, headingEl.firstChild);
        
        // Create the menu dropdown button
        var menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: headingEl,
            margin: '0px 0px 0px auto',
            label: '<i class="fa fa-ellipsis-v"></i>',
            dropdownAlignment: 'right'
        });
        
        // Create the menuDropDownBtnAddEl element
        var menuDropDownBtnConnectionEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-plug" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">' + connectButtonName + '</span>'
        });
        
        // Create menuDropDownBtnConfigEl
        var menuDropDownBtnConfigEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-wrench" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Configuration</span>'
        });
        
        // Create messageContainerEl element
        let messageContainerEl = lx.createElement('DIV', {
            parent: connectionContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                padding: '30px 30px 15px 30px',
                fontSize: '14px',
                flex: '1 1 100%',
                overflow: 'auto'
            },
            innerHTML: message
        });
        
        // Checks if button should be a connect or a config button
        if( connectButtonName === 'Connect' ) {
            menuDropDownBtnConnectionEl.addEventListener('click', connectionClickEventHandler);
            
            new lx.component.Button({
                renderTo: connectionContainerEl,
                label: 'Connect',
                width: '120px',
                margin: '0px 15px 15px auto',
                
                onClick: connectionClickEventHandler
            });
        }
        else {
            menuDropDownBtnConnectionEl.addEventListener('click', disconnectionClickEventHandler);
            
            new lx.component.Button({
                renderTo: connectionContainerEl,
                label: 'Configuration',
                width: '120px',
                margin: '15px 15px 15px auto',
                
                onClick: configBtnClickEventHandler
            });
        }
        
        // Check if connected to the api
        if( isConnected ) {
            // Setup firm details heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Firm Details'
            });
            
            let firmDetailsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup bank details heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Bank Details'
            });
            
            let bankDetailsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup general accounts heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'General Accounts'
            });
            
            let accountsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup salary accounts heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Salary Accounts'
            });
            
            let salaryAccountsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            let salaryAccountsContainerEl = lx.createElement('DIV', {
                parent: salaryAccountsSectionEl,
                style: {
                    display: 'block'
                }
            });
            
            let employeeAccountsContainerEl = lx.createElement('DIV', {
                parent: salaryAccountsSectionEl,
                style: {
                    display: 'none'
                }
            });
            
            // Add event handler for the edit button
            menuDropDownBtnConfigEl.addEventListener('click', configDropDownBtnEditElClickEventHandler);
            
            // Display the connection message
            if (configItems.length !== 0) {
                message = message + '</br>';
            }
            
            // Add values to config list
            let displayContainerEl = messageContainerEl;
            for( var i = 0; i < configItems.length; i++ ) {
                let value = configItems[i].value;
                let name = configItems[i].name;
                let accountLabel = '';
                if ( configItems[i].name === 'Firm' ){
                    displayContainerEl = firmDetailsSectionEl;
                    name = 'Firm:';
                }
                else if ( configItems[i].name === 'Bank' ){
                    displayContainerEl = bankDetailsSectionEl;
                    value = configItems[i].bankName;
                    name = 'Bank:';
                }
                else if( configItems[i].name === 'Salary' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    name = 'Salary Account:';
                }
                else if( configItems[i].name === 'includeEmployeeName' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    value = 'No';
                    name = 'Include Employee Name?';
                    if (configItems[i].value) {
                        value = 'Yes';
                    }
                }
                else if( configItems[i].name === 'useSingleSalaryAccount' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    value = 'No';
                    name = 'Use Single Salary Account?';
                    if( configItems[i].value ) {
                        employeeAccountsContainerEl.style.display = 'none';
                        value = 'Yes';
                    }
                    else {
                        employeeAccountsContainerEl.style.display = 'block';
                    }
                }
                else {
                    if( configItems[i].employeeId === null ) {
                        displayContainerEl = accountsSectionEl;
                        accountLabel = ' Account:';
                    }
                    else {
                        displayContainerEl = employeeAccountsContainerEl;
                        accountLabel = ':';
                    }
                }
                
                // Create config list item
                var configOptionDisplay = new lx.component.Display({
                    renderTo: displayContainerEl,
                    label: name + accountLabel,
                    labelWidth: '230px',
                    fontSize: '14px',
                    margin: '10px 0px 0px 0px'
                });
                configOptionDisplay.setValue( (value !== '' ? value : '-') );
            }
        }
        else {
            // Disable the config button if not connected
            lx.applyStyle(menuDropDownBtnConfigEl, {color: lx.style.global.disabledColor});
        }
        // messageContainerEl.innerHTML = message;
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
        
        // Check and load the accounting configuration, if available
        checkLexproAccountingConnection();
        
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
    
    // disconnection Click EventHandler
    function disconnectionClickEventHandler( ) {
        loader.show();
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=disconnect',
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                loader.hide();
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to diconnect from Lexpro Accounting.'
                    });
                    
                    return;
                }
                contentContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
    }
    
    function configBtnClickEventHandler () {
        // Create a modal window
        var editApiConfigDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '640px',
            maxHeight: '694px'
        });
        
        // Create the edit editCompanyDetails panel
        var editApiConfigDetailsPanel = new app.panel.EditLexproAccountingConfigDetails({
            renderTo: editApiConfigDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                contentContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editApiConfigDetailsModal.addEventListener('destroy', function() {
            editApiConfigDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editApiConfigDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editApiConfigDetailsModal.show();
        editApiConfigDetailsPanel.focus();
    }
    
    function configDropDownBtnEditElClickEventHandler ( ) {
        // Create a modal window
        var editApiConfigDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '640px',
            maxHeight: '694px'
        });
        
        // Create the edit editCompanyDetails panel
        var editApiConfigDetailsPanel = new app.panel.EditLexproAccountingConfigDetails({
            renderTo: editApiConfigDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                contentContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editApiConfigDetailsModal.addEventListener('destroy', function() {
            editApiConfigDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editApiConfigDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editApiConfigDetailsModal.show();
        editApiConfigDetailsPanel.focus();
    }
    
    // connectionDropDownBtnAddEl click event handler
    function connectionClickEventHandler( ) {
        // Create a modal window
        var apiLoginModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '364px'
        });
        
        // Create the edit apiLogin panel
        var apiLoginPanel = new app.panel.LexproAccountingLogin({
            renderTo: apiLoginModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onLogin: function() {
                app.route.popState();
                loader.show();
                contentContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        apiLoginModal.addEventListener('destroy', function() {
            apiLoginPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: apiLoginModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        apiLoginModal.show();
        apiLoginPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};