/* globals app, lx */
'use strict';

// EDIT CONSULTANT PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditConsultant = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let consultantDetailsSectionEl = null;
    let consultantNameTxt = null;
    let consultantEmailAddressTxt = null;
    let consultantTelNumberTxt = null;
    let consultantCellNumberTxt = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let saveBtnContainerEl = null;
    let saveBtn = null;
    
    let consultantId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadConsultant() {
        
        loader.show();
        
        lx.sendJSON({
            url: 'exec.php?c=Consultant&fn=get',
            data: {
                consultantId: consultantId
            },
            onSuccess: function( responseText ) {
                
                loader.hide();

                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Consultant Failed',
                        message: response.error
                    });
                }
                
                consultantNameTxt.setValue( response.consultant.name );
                consultantEmailAddressTxt.setValue( response.consultant.emailAddress );
                consultantTelNumberTxt.setValue( response.consultant.telNumber );
                consultantCellNumberTxt.setValue( response.consultant.cellNumber );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            consultantId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('add', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        consultantId = compConfig.consultantId;
        
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
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Edit Consultant'
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
        // CONSULTANT DETAILS SECTION
        //
        
        // Create example section
        consultantDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the consultantNameTxt component
        consultantNameTxt = new lx.component.Textbox({
            renderTo: consultantDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name'
        });
        
        // Create the consultantEmailAddressTxt component
        consultantEmailAddressTxt = new lx.component.Textbox({
            renderTo: consultantDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Email Address'
        });
        
        // Create the consultantTelNumberTxt component
        consultantTelNumberTxt = new lx.component.Textbox({
            renderTo: consultantDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Telephone Number'
        });
        
        // Create the consultantCellNumberTxt component
        consultantCellNumberTxt = new lx.component.Textbox({
            renderTo: consultantDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Cell Number'
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
        
        // Create the saveBtnContainerEl element
        saveBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Load form data
        loadConsultant();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        consultantNameTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
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
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        if( consultantNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the consultant name');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Consultant&fn=update',
            data: {
                id: consultantId,
                name: consultantNameTxt.getValue().trim(),
                emailAddress: consultantEmailAddressTxt.getValue().trim(),
                telNumber: consultantTelNumberTxt.getValue().trim(),
                cellNumber: consultantCellNumberTxt.getValue().trim()
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('add', {
                    srcPanel: me, 
                    consultantId: response.id, 
                    consultantName: consultantNameTxt.getValue().trim()
                });
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};