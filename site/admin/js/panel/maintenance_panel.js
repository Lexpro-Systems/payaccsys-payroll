/* globals app, lx */
'use strict';


// MAINTENANCE PANEL
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
app.panel.Maintenance = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleTextEl = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let updateSchemasSectionEl = null;
    let updateSchemasBtn = null;
    
    let resetWhatsNewMessageSectionEl = null;
    let resetWhatsNewMessageBtn = null;
    
    let processLeaveSectionEl = null;
    let processLeaveBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
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
            innerHTML: 'Maintenance'
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
        // UPDATE SCHEMAS SECTION
        //
        
        // Create the updateSchemasSectionEl element
        updateSchemasSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '20px 0px 0px 0px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            },
            innerHTML: 
                '<div><div style="font-size: 18px;">Update Schemas</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Make sure all the schemas are up-to-date with the latest database changes.' + 
                '</div></div>'
        });
        
        // Create the updateSchemasBtn component
        updateSchemasBtn = new lx.component.Button({
            renderTo: updateSchemasSectionEl,
            label: 'Update',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: updateSchemasBtnClickEventHandler
        });
        
        
        //
        // RESET WHAT'S NEW SECTION
        //
        
        // Create the resetWhatsNewMessageSectionEl element
        resetWhatsNewMessageSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '20px 0px 0px 0px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            },
            innerHTML: 
                '<div><div style="font-size: 18px;">Reset \'What\'s New\' Message</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Reset the user messages read for the \'What\'s New\' message.' + 
                '</div></div>'
        });
        
        // Create the resetWhatsNewMessageBtn component
        resetWhatsNewMessageBtn = new lx.component.Button({
            renderTo: resetWhatsNewMessageSectionEl,
            label: 'Reset',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: resetWhatsNewMessageBtnClickEventHandler
        });
        
        
        //
        // PROCESS LEAVE SECTION
        //
        
        // Create the processLeaveSectionEl element
        processLeaveSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '20px 0px 0px 0px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            },
            innerHTML: 
                '<div><div style="font-size: 18px;">Process Leave</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Process leave for all active companies for a specified period.' + 
                '</div></div>'
        });
        
        // Create the resetWhatsNewMessageBtn component
        processLeaveBtn = new lx.component.Button({
            renderTo: processLeaveSectionEl,
            label: 'Process',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: processLeaveBtnClickEventHandler
        });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // updateSchemasBtn click event handler
    function updateSchemasBtnClickEventHandler() {
        me.hide();
        
        let updateCompaniesPanel = new app.panel.UpdateCompanies({
            renderTo: app.mainPanel.getContainer(),
            margin: '40px',
            maxWidth: '1200px',
            maxHeight: '100%',
            
            onCancel: function() {
                app.route.popState();
            },
            
            onUpdate: function() {
                // ...
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: updateCompaniesPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        updateCompaniesPanel.showModal();
        updateCompaniesPanel.focus();
    }
    
    // resetWhatsNewMessageBtn click event handler
    function resetWhatsNewMessageBtnClickEventHandler() {
        new lx.component.Messagebox({
            title: 'Reset \'What\'s New\' Message',
            message: 
                'The \'What\'s New\' message read will be reset for all users. Are you sure you wish to continue?',
            buttons: [
                {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                {name: 'reset', label: 'Reset', isDefault: true}
            ],
            onClose: function( closeEvent ) {
                // Should the message be reset?
                if( closeEvent.button === 'reset' ) {
                    // Reset the message
                    lx.sendJSON({
                        url: 'exec.php?c=User&fn=resetWhatsNewMessage',
                        onSuccess: function( responseText ) {
                            let response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Resetting Message Failed',
                                    message: response.error
                                });
                                return;
                            }
                            
                            // new lx.component.Messagebox({
                            //     message: 'The \'What\'s New\' message has been successfully reset for all users.'
                            // });
                        }
                    });
                }
                else {
                    return;
                }
            }
        });
    }
    
    // processLeaveBtn click event handler
    function processLeaveBtnClickEventHandler() {
        // Create a modal window
        let processLeaveModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '1200px',
            maxHeight: '100%'
        });
        
        // Create the processLeavePanel panel
        let processLeavePanel = new app.panel.ProcessLeave({
            renderTo: processLeaveModal.getContainer(),
            
            onCancel: function() {
                app.route.popState();
            },
            
            onUpdate: function() {
                // ...
            }
        });
        
        processLeavePanel.show();
        processLeavePanel.focus();
        
        // Add destroy event listener to modal to destroy the contained panel.
        processLeaveModal.addEventListener('destroy', function() {
            processLeavePanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: processLeaveModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        processLeaveModal.show();
        processLeavePanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};