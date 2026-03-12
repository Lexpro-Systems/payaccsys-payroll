/* globals app, lx */
'use strict';


// LEAVE REQUEST DECLINE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDecline           This event is fired after the leave request was successfully declined.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.LeaveRequestDecline = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentEl = null;
    
    var reasonDeclinedSectionEl = null;
    var reasonDeclinedTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var declineBtnContainerEl = null;
    var declineBtn = null;
    

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
        var compConfig = {
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDecline') ) me.addEventListener('decline', compConfig.onDecline);
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
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: app.panelBackgroundColor
            },
            innerHTML: 'Decline Leave Request'
        });
        
        // Create the loaderContainerEl element
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                flex: '1 1 100%',
                backgroundColor: app.panelBackgroundColor,
                position: 'relative',
                overflow: 'auto'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                boxSizing: 'border-box',
                height: '100%',
                backgroundColor: app.panelBackgroundColor,
                padding: '0px 0px 15px 0px',
                overflow: 'auto'
            }
        });
        
        
        //
        // REASON DECLINED SECTION
        //
        
        // Create example heading component
        // new lx.component.Heading({
        //     renderTo: contentEl,
        //     label: 'Example Heading',
        //     margin: '0px 15px',
        //     width: ''
        // });
        
        // Create reasonDeclinedSectionEl element
        reasonDeclinedSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.panelBackgroundColor,
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the reasonDeclinedTxt component
        reasonDeclinedTxt = new lx.component.Textbox({
            renderTo: reasonDeclinedSectionEl,
            label: 'The reason the request was declined (for the employee&apos;s attention):',
            labelAlign: 'top',
            multiline: true,
            height: '80px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
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
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the declineBtnContainerEl element
        declineBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the declineBtn component
        declineBtn = new lx.component.Button({
            renderTo: declineBtnContainerEl,
            label: 'Decline',
            width: '120px',
            
            onClick: declineBtnClickEventHandler
        });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        reasonDeclinedTxt.focus();
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
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Decline button click event handler
    function declineBtnClickEventHandler() {
        me.fireEvent('decline', {srcPanel: me, message: reasonDeclinedTxt.getValue()});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};