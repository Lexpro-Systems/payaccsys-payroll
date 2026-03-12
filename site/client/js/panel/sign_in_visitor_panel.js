/* jslint node: true */
/* globals app, lx */
'use strict';


// SIGN IN VISITOR PANEL
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
app.panel.SignInVisitor = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var detailsSectionEl = null;
    var signInTimeContainerEl = null;
    var signInDate = null;
    var signInTimeTxt = null;
    var visitorContainerEl = null;
    var visitorSelect = null;
    var nameTxt = null;
    var emailTxt = null;
    var cellNumberTxt = null;
    var registrationTxt = null;
    var idNumberTxt = null;
    var regularCb = null;
    var temperatureTxt = null;
    var reasonForVisitTxt = null;
    var noteTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var signInContainerEl = null;
    var signInBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadVisitors () {
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=getVisitorsList',
            data: {
                searchString: visitorSelect.getSearchString(),
                limit: 50,
                offset: (visitorSelect.getItemCount() - 1),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Visitor Failed',
                        message: response.error
                    });
                    return;
                }
                
                var visitor = [];
                for( var i = 0; i < response.visitor.length; i++ ) {
                    visitor.push({
                        value: response.visitor[i].id,
                        text: response.visitor[i].name
                    });
                }
                visitorSelect.addItems( visitor );
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
        if( compConfig.hasOwnProperty('onSignIn') ) me.addEventListener('sign_in', compConfig.onSignIn);
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
            innerHTML: 'Sign In Visitor'
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
        // DETAILS SECTION
        //
        
        // Create example section
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
        
        // Create signInTimeContainerEl element
        signInTimeContainerEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end'
            }
        });
        
        signInDate = new lx.component.DatePicker({
            renderTo: signInTimeContainerEl,
            label: 'Date',
            flex: '1 1 100%'
        });
        
        signInDate.setValue(new Date().toISOString().slice(0, 10));
        
        signInTimeTxt = new lx.component.Textbox({
            renderTo: signInTimeContainerEl,
            label: 'Time',
            width: '80px',
            margin: '0px 0px 0px 20px'
        });
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if(hours < 10) {
            hours = '0' + hours;
        }
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        signInTimeTxt.setValue(hours + ':' + minutes);
        
        // Create visitorContainerEl element
        visitorContainerEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                margin: '15px 0px 0px 0px'
            }
        });
        
        visitorSelect = new lx.component.Selectbox({
            renderTo: visitorContainerEl,
            label: 'Visitor',
            flex: '1 1 100%',
            search: true,
            
            onSearch: function() {
                visitorSelect.clear();
                let visitor = [];
                visitor.push({
                    value: null,
                    text: 'New visitor'
                });
                visitorSelect.addItems( visitor );
                loadVisitors( );
            },
            
            onListScrollEnd: function() {
                loadVisitors( );
            },
            
            onChange: visitorSelectOnChangeEventHandler
        });
        visitorSelect.setValue( null, 'New visitor' );
        
        regularCb = new lx.component.Checkbox({
            renderTo: visitorContainerEl,
            label: 'Regular',
            width: '',
            labelAlign: 'right',
            labelWidth: '',
            margin: '15px 0px 3px 20px'
        });
        
        
        nameTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Name',
            margin: '15px 0px 0px 0px'
        });
        
        emailTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Email Address',
            margin: '15px 0px 0px 0px'
        });
        
        cellNumberTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Cell Number',
            margin: '15px 0px 0px 0px'
        });
        
        registrationTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Vehicle Registration Number',
            margin: '15px 0px 0px 0px'
        });
        
        idNumberTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'ID / Passport Number',
            margin: '15px 0px 0px 0px'
        });
        
        reasonForVisitTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Reason for visit',
            margin: '15px 0px 0px 0px'
        });
        
        temperatureTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Temperature',
            margin: '15px 0px 0px 0px'
        });
        
        noteTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Notes',
            margin: '15px 0px 0px 0px',
            multiline: true,
            height: '150px'
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
        
        // Create the signInContainerEl element
        signInContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the signInBtn component
        signInBtn = new lx.component.Button({
            renderTo: signInContainerEl,
            label: 'Sign In',
            width: '120px',
            
            onClick: signInBtnClickEventHandler
        });
        
        let visitor = [];
        visitor.push({
            value: null,
            text: 'New visitor'
        });
        visitorSelect.addItems( visitor );
        loadVisitors();
        
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
        visitorSelect.focus();
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
    
    function visitorSelectOnChangeEventHandler() {
        if (visitorSelect.getValue() === null) {
            nameTxt.setValue('');
            emailTxt.setValue('');
            cellNumberTxt.setValue('');
            registrationTxt.setValue('');
            idNumberTxt.setValue('');
            regularCb.setValue(false);
            temperatureTxt.setValue('');
            reasonForVisitTxt.setValue('');
            noteTxt.setValue('');
        }
        else {
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=getPerson',
                data: {
                    id: visitorSelect.getValue(),
                    isEmployee: false
                },
                onSuccess: function( responseText ) {
                    loader.hide();
                    
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Attendance Failed',
                            message: response.error
                        });
                    }
                    nameTxt.setValue(response.person.alias);
                    emailTxt.setValue(response.person.emailAddress);
                    cellNumberTxt.setValue(response.person.cellNumber);
                    registrationTxt.setValue(response.person.vehicleRegistration);
                    idNumberTxt.setValue(response.person.idNumber);
                    regularCb.setValue(response.person.isRegular);
                }
            });
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Add button click event handler
    function signInBtnClickEventHandler() {
        if (visitorSelect.getValue() !== null) {
            signInBtn.showLoader();
            signInBtn.disable();
            
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=getPerson',
                data: {
                    id: visitorSelect.getValue(),
                    isEmployee: false
                },
                onSuccess: function( responseText ) {
                    signInBtn.hideLoader();
                    signInBtn.enable();
                    loader.hide();
                    
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Attendance Failed',
                            message: response.error
                        });
                        return;
                    }
                    
                    if (response.person.timeOut === null && response.person.timeIn !== null) {
                            new lx.component.Messagebox({
                                title: 'Sign In',
                                message: 'The visitor \'' + response.person.alias + '\' is already signed in'
                            });
                            return;
                    }
                    else {
                        
                        if (!lx.util.checkTimeFormat(signInTimeTxt.getValue())) {
                            signInBtn.showWarning('Time is invalid. Please enter a time in HH:MM format.');
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
                        
                        if (signInDate.getValue() > now) {
                            signInBtn.showWarning('Sign in date cannot be in the future');
                            return;
                        }
                        
                        if (signInDate.getValue() == now) {
                            if ( signInTimeTxt.getValue() > hours + ':' + minutes ) {
                                signInBtn.showWarning('Sign in time cannot be in the future');
                                return;
                            }
                        }
                        
                        signInBtn.showLoader();
                        signInBtn.disable();
                        
                        lx.sendJSON({
                            url: 'exec.php?c=Attendance&fn=updateVisitorDetails',
                            data: {
                                id: visitorSelect.getValue(),
                                name: nameTxt.getValue(),
                                emailAddress: emailTxt.getValue(),
                                cellNumber: cellNumberTxt.getValue(),
                                registration: registrationTxt.getValue(),
                                idNumber: idNumberTxt.getValue(),
                                isRegular: regularCb.getValue()
                            },
                            onSuccess: function( responseText ) {
                                signInBtn.hideLoader();
                                signInBtn.enable();
                                loader.hide();
                                
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Loading Attendance Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                me.fireEvent('sign_in', {
                                    srcPanel: me, 
                                    visitorId: visitorSelect.getValue(),
                                    signInDate: signInDate.getValue(),
                                    signInTime: signInTimeTxt.getValue(),
                                    reasonForVisit: reasonForVisitTxt.getValue(),
                                    temperature: temperatureTxt.getValue(),
                                    note: noteTxt.getValue()
                                });
                                return;
                            }
                        });
                    }
                }
            });
            
        }
        else {
            
            if (!lx.util.checkTimeFormat(signInTimeTxt.getValue())) {
                signInBtn.showWarning('Time is invalid. Please enter a time in HH:MM format.');
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
            
            if (signInDate.getValue() > now) {
                signInBtn.showWarning('Sign in date cannot be in the future');
                return;
            }
            
            if (signInDate.getValue() == now) {
                if ( signInTimeTxt.getValue() > hours + ':' + minutes ) {
                    signInBtn.showWarning('Sign in time cannot be in the future');
                    return;
                }
            }
            
            if( nameTxt.getValue() === '' ) {
                signInBtn.showWarning('Please enter a name');
                
                return;
            }
            
            signInBtn.showLoader();
            signInBtn.disable();
            
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=addVisitor',
                data: {
                    name: nameTxt.getValue(),
                    emailAddress: emailTxt.getValue(),
                    cellNumber: cellNumberTxt.getValue(),
                    registration: registrationTxt.getValue(),
                    idNumber: idNumberTxt.getValue(),
                    regular: regularCb.getValue()
                },
                onSuccess: function( responseText ) {
                    signInBtn.hideLoader();
                    signInBtn.enable();
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        signInBtn.showWarning(response.error);
                        return; 
                    }
                    
                    me.fireEvent('sign_in', {
                        srcPanel: me, 
                        visitorId: response.visitorId,
                        signInDate: signInDate.getValue(),
                        signInTime: signInTimeTxt.getValue(),
                        reasonForVisit: reasonForVisitTxt.getValue(),
                        temperature: temperatureTxt.getValue(),
                        note: noteTxt.getValue()
                    });
                }
            });
        }
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};