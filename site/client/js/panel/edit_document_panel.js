/* globals app, lx */
'use strict';

// EDIT DOCUMENT PANEL
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
app.panel.EditDocument = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var documentDetailsSectionEl = null;
    var descriptionTxt = null;
    var categorySelect = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    
    var documentId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadDocument() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Document&fn=get',
            data: {
                documentId: documentId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Document Failed',
                        message: response.error
                    });
                }
                
                descriptionTxt.setValue( response.document.description );
                categorySelect.setValue( response.document.documentCategoryId, response.document.documentCategoryName);
            }
        });
    }
    
    function loadDocumentCategories() {
        lx.sendJSON({
            url: 'exec.php?c=Document&fn=getCategoryList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Categories Failed',
                        message: response.error
                    });
                }
                
                var categories = [];
                categories.push({value: null, text: 'None'});
                for( var i = 0; i < response.categories.length; i++ ) {
                    categories.push({
                        value: response.categories[i].id,
                        text: response.categories[i].name
                    });
                }
                
                categorySelect.clear();
                categorySelect.addItems( categories );
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
            
            documentId: null
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
        documentId = compConfig.documentId;
        
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
            innerHTML: 'Edit Document'
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
        // DEPARTMNT DETAILS SECTION
        //
        
        // Create example section
        documentDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the descriptionTxt component
        descriptionTxt = new lx.component.Textbox({
            renderTo: documentDetailsSectionEl,
            label: 'Description'
        });
        
        categorySelect = new lx.component.Selectbox({
            renderTo: documentDetailsSectionEl,
            label: 'Category',
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
        loadDocument();
        loadDocumentCategories();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
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
        descriptionTxt.focus();
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
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        if( descriptionTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the document description.');
            
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Document&fn=update',
            data: {
                documentId: documentId,
                description: descriptionTxt.getValue().trim(),
                documentCategoryId: categorySelect.getValue()
            },
            onSuccess: function( responseText ) {
                
                saveBtn.hideLoader();
                saveBtn.enable();
                
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('save', {
                    srcPanel: me, 
                    documentId: response.documentId, 
                    departmentName: descriptionTxt.getValue().trim()
                });
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};