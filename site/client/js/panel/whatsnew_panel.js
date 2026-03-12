/* jslint node: true */
/* globals app, lx */
'use strict';


// WHATS NEW PANEL
//
// Config:
//  renderTo:               The parent DOM object of this object.
//  width:                  Set the panel width
//  height:                 Set the panel height
//  flex:                   CSS flex property for the panel
//  showDontShowCheckbox    If true the 'Don't show again' checkbox will be shown.  If false it will be hidden.  Default to true.
//  show:                   If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                          Default to false.
//
// Events:
//
//  onSave                  This event is fired after the profile data was successfully saved.
//  onCancel                This event is fired when the user click the cancel button
//  onDestroy               This event is fired just before the component is destroyed.
//
app.panel.WhatsNew = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    var titleEl = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentEl = null;
    
    var iframeEl;
    
    var buttonContainerEl = null;
    var dontShowCheckbox = null;
    var previousBtn = null;
    var nextBtn = null;
    var closeBtn = null;
    
    var releases = null;
    var releaseIndex = null;
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
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
            showDontShowCheckbox: true,
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
        titleEl = lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                color: '#FFFFFF',
                backgroundColor: lx.style.global.highlightColor, // '#3B3B3B',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'What\'s New'
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
                backgroundColor: '#F4F5F6',
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
                backgroundColor: '#F4F5F6',
                overflow: 'auto'
            }
        });
        
        
        //
        // IFRAME SECTION
        //
        
        iframeEl = lx.createElement('IFRAME', {
            parent: contentEl,
            style: {
                width: '100%',
                height: '100%',
                display: 'block',
                border: 'none',
                margin: '0px',
                padding: '0px'
            }
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
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the dontShowCheckbox component
        dontShowCheckbox = new lx.component.Checkbox({
            renderTo: buttonContainerEl,
            label: 'Don\'t show again',
            labelAlign: 'right',
            margin: '0px 20px 0px 0px',
            width: ''
        });
        if( compConfig.showDontShowCheckbox !== true ) dontShowCheckbox.hide();
        
        // Create the previousBtn component
        previousBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Previous',
            width: '120px',
            margin: '0px 20px 0px 0px',
            
            onClick: previousBtnClickEventHandler
        });
        
        // Create the nextBtn component
        nextBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Next',
            width: '120px',
            margin: '0px 02px 0px 0px',
            
            onClick: nextBtnClickEventHandler
        });
        
        // Create the closeBtn component
        closeBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Close',
            width: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: closeBtnClickEventHandler
        });
        
        // Load the latest what's new release
        lx.sendJSON({
            url: 'exec.php?c=WhatsNew&fn=getList',
            
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                
                if( response.ok !== true ) return;
                
                if( response.releases.length > 0 ) {
                    releases = response.releases;
                    releaseIndex = 0;
                    nextBtn.disable();
                    titleEl.innerHTML = 'What\'s New: (' + (releases.length - releaseIndex) + '/' + releases.length + ')';
                    iframeEl.src = 'whats_new/' + releases[releaseIndex];
                }
            }
        });
        
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
    
    // Previous button click event handler
    function previousBtnClickEventHandler() {
        // Is the index not in bounds?
        if( releaseIndex >= (releases.length -1)) {
            return;
        }
        
        // Go to previous release
        releaseIndex = releaseIndex + 1;
        
        // Have we reached the first release?
        if( releaseIndex >= (releases.length -1) ) {
            previousBtn.disable();
        }
        else {
            nextBtn.enable();
        }
        
        // Display the release info
        titleEl.innerHTML = 'What\'s New: (' + (releases.length - releaseIndex) + '/' + releases.length + ')';
        iframeEl.src = 'whats_new/' + releases[releaseIndex];
    }
    
    // Next button click event handler
    function nextBtnClickEventHandler() {
        // Is the index not in bounds?
        if( releaseIndex <= 0) {
            return;
        }
        
        // Go to next release
        releaseIndex = releaseIndex - 1;
        
        // Have we reached the first release?
        if( releaseIndex <= 0 ) {
            nextBtn.disable();
        }
        else {
            previousBtn.enable();
        }
        
        // Display the release info
        titleEl.innerHTML = 'What\'s New: (' + (releases.length - releaseIndex) + '/' + releases.length + ')';
        iframeEl.src = 'whats_new/' + releases[releaseIndex];
    }
    
    // Close button click event handler
    function closeBtnClickEventHandler() {
        // Mark the message as read
        if( dontShowCheckbox.getValue() === true ) {
            lx.sendJSON({
                url: 'exec.php?c=User&fn=readUserMessage',
                data: {
                    number: 4
                }
            });
        }
        
        app.route.popState();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};