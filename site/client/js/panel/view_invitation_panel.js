/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW INVITATION PANEL
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
app.panel.ViewInvitation = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var inviteDetailsSectionEl = null;
    var inviteeDisplay = null;
    var inviteeEmailDisplay = null;
    var senderNameDisplay = null;
    var senderEmailDisplay = null;
    var sentDateDisplay = null;
    var expiryDateDisplay = null;
    var statusDisplay = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var resendBtnContainerEl = null;
    var resendBtnTooltip = null;
    var resendBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the selected user details
    function loadInviteDetails() {
        
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=getInvitationById',
            data: {
                invitationId: parseInt(config.invitationId)
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load invite',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                inviteeDisplay.setValue(response.invitation.invitee.name);
                inviteeEmailDisplay.setValue(response.invitation.invitee.emailAddress);
                senderNameDisplay.setValue(response.invitation.sender);
                sentDateDisplay.setValue(response.invitation.sentOn);
                expiryDateDisplay.setValue(response.invitation.expiryDate);
                statusDisplay.setValue(response.invitation.status.name);
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
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
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
                borderColor: '#DFDFDF'
            },
            innerHTML: 'View Invitation'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // EXAMPLE SECTION
        //
        
        // Create invite details section
        inviteDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the nameDisplay component
        inviteeDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Invitee Name',
            labelWidth: '230px'
        });
        
        // Create the inviteeEmailDisplay component
        inviteeEmailDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Invitee Email',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the senderNameDisplay component
        senderNameDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Sender Name',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        sentDateDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Sent Date',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        expiryDateDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Expiry Date',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        statusDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Status',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
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
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the resendBtnContainerEl element
        resendBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the resendBtnTooltip component.
        resendBtnTooltip = new lx.component.Tooltip({
            renderTo: resendBtnContainerEl,
            maxWidth: '300px',
            arrowOffset: 'center',
            
            onBlur: resendBtnTooltipBlurEventHandler
        });
        
        // Create the resendBtn component
        resendBtn = new lx.component.Button({
            renderTo: resendBtnContainerEl,
            label: 'Resend',
            width: '120px',
            
            onClick: resendBtnClickEventHandler
        });
        
        loader.show(false);
        loadInviteDetails();
        
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
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // resendBtnTooltip blur event handler
    function resendBtnTooltipBlurEventHandler( event ) {
        event.srcComponent.hide();
    }
    
    // Save button click event handler
    function resendBtnClickEventHandler() {
        
        resendBtn.showLoader();
        resendBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=resend',
            data: {
                invitationId: parseInt(config.invitationId)
            },
            onSuccess: function( responseText ) {
                resendBtn.hideLoader();
                resendBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    resendBtnTooltip.setText(response.error);
                    resendBtnTooltip.show();
                    resendBtnTooltip.focus();
                    return;
                }
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};