/* jslint node: true */
/* globals app, lx */
'use strict';


// SIGN OUT VISITOR PANEL
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
app.panel.SignOutVisitor = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var detailsSectionEl = null;
    var signOutTimeContainerEl = null;
    var signOutDate = null;
    var signOutTimeTxt = null;
    var signInTimeEl = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var signOutContainerEl = null;
    var signOutBtn = null;
    
    var signInTimestamp = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Convert time in seconds to string format
    function secondsToTime( seconds ) {
        if( seconds <= 0 ) {
            return '-';
        }
        
        seconds = Number(seconds);
        let d = Math.floor(seconds / (3600*24));
        let h = Math.floor(seconds % (3600*24) / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        // let s = Math.floor(seconds % 60);
        
        var time = '';
        
        if( d > 0 ) {
            let value = ' days';
            if( d == 1 ) value = ' day';
            time = time + d + value;
        }
        
        if( h > 0 ) {
            let value = ' hours';
            if( h == 1 ) value = ' hour';
            if( time !== '' ) time = time + ', ';
            time = time + h + value;
        }
        
        if( m > 0 ) {
            let value = ' minutes';
            if( m == 1 ) value = ' minute';
            if( time !== '' ) time = time + ' and ';
            time = time + m + value;
        }
        
        // if( s > 0 ) {
        //     let value = ' seconds';
        //     if( s == 1 ) value = ' second';
        //     if( time !== '' ) time = time + ', ';
        //     time = time + s + value;
        // }
        
        if( time === '' ) {
            time = '0 minutes';
        }
        
        return time;
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
            
            timeIn: null,
            timeInDate: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
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
            innerHTML: 'Sign Out Employee/Visitor'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'visible',
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
        // DETAILS SECTION
        //
        
        // Create detailsSectionEl section
        detailsSectionEl = lx.createElement('DIV', {
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
        
        // Create signOutTimeContainerEl element
        signOutTimeContainerEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end'
            }
        });
        
        // Create signOutDate component
        signOutDate = new lx.component.DatePicker({
            renderTo: signOutTimeContainerEl,
            label: 'Date',
            flex: '1 1 100%',
            
            onChange: onDateTimeChangeEventHandler,
            onInput: onDateTimeChangeEventHandler
        });
        signOutDate.setValue(new Date().toISOString().slice(0, 10));

        lx.sendJSON({
            url: 'exec.php?c=User&fn=get',
            onSuccess: function( jsonResult ) {
                let result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load user details'
                    });
                    
                    return;
                }
 
                // Set company and user details
                if( result.user.company.name === 'Lexpro' ) {
                    signOutDate.disable();
                    signOutTimeTxt.disable();
                }
            }
        });
        
        // Create signOutTimeTxt component
        signOutTimeTxt = new lx.component.Textbox({
            renderTo: signOutTimeContainerEl,
            label: 'Time',
            width: '80px',
            margin: '0px 0px 0px 20px',
            
            onInput: onDateTimeChangeEventHandler
        });
        
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if(hours < 10) {
            hours = '0' + hours;
        }
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        signOutTimeTxt.setValue(hours + ':' + minutes);
        
        // Create signInTimeEl component
        signInTimeEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                margin: '15px 0px 0px 0px',
                color: '#666666'
            }
        });
        signInTimestamp = compConfig.timeInDate + ' ' + compConfig.timeIn;
        onDateTimeChangeEventHandler();
        
        
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
        
        // Create the signOutContainerEl element
        signOutContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the signOutBtn component
        signOutBtn = new lx.component.Button({
            renderTo: signOutContainerEl,
            label: 'Sign Out',
            width: '120px',
            
            onClick: signOutBtnClickEventHandler
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
        signOutDate.focus();
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
    
    // Event handler that is called to update the time display
    function onDateTimeChangeEventHandler() {
        var startDate = new Date(signInTimestamp);
        var endDate = new Date(signOutDate.getValue().trim() + ' ' + signOutTimeTxt.getValue().trim() + ':01');
        
        var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        
        signInTimeEl.innerHTML = 'Total Time: ' + secondsToTime(seconds);
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Add button click event handler
    function signOutBtnClickEventHandler() {
        if (!lx.util.checkTimeFormat(signOutTimeTxt.getValue())) {
            signOutBtn.showWarning('Time is invalid. Please enter a time in HH:MM format.');
            return;
        }
        
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if(hours < 10) {
            hours = '0' + hours;
        }
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        var now = new Date().toISOString().slice(0,10);
        
        if (signOutDate.getValue() > now) {
            signOutBtn.showWarning('Sign in date cannot be in the future');
            return;
        }
        
        if (signOutDate.getValue() == now) {
            if ( signOutTimeTxt.getValue() > hours + ':' + minutes ) {
                signOutBtn.showWarning('Sign in time cannot be in the future');
                return;
            }
        }
        
        me.fireEvent('add', {
            srcPanel: me, 
            signOutDate: signOutDate.getValue(),
            signOutTime: signOutTimeTxt.getValue(),
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};