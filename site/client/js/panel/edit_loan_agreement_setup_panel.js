/* globals app, lx */
'use strict';

// EDIT LOAN AGREEMENT SETUP PANEL
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
app.panel.EditLoanAgreementSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loader = null;
    var contentContainerEl = null;
    
    var templateSettingsDetailsSectionEl = null;
    
    var loanAgreementImages = [];
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var previewLoanAgreementBtn = null;
    var saveBtn = null;
    
    var loanAgreementImageDirExists = false;
    var loanAgreementConfigItems = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    function loadConfig() {
        loanAgreementConfigItems = [];
        templateSettingsDetailsSectionEl.innerHTML = '';
        
        lx.sendJSON({
            url: 'exec.php?c=LoanAgreementConfig&fn=getLoanAgreementTemplatesConfig',
            data: {
                loanAgreementTemplateId: config.loanAgreementTemplateId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Loan Agreement Config Failed',
                        message: response.error
                    });
                }
                
                loanAgreementImageDirExists = response.clientDataDirExists;
                if (!loanAgreementImageDirExists) {
                    new lx.component.Messagebox({
                        title: 'System Error',
                        message: 'Company directory not found. Please contact support'
                    });
                }
                
                for (var i = 0; i < response.templateConfig.length; i++) {
                    
                    createConfigItems(response.templateConfig[i].description, response.templateConfig[i].name, response.templateConfig[i].value, response.templateConfig[i].type);
                }
            }
        });
    }
    
    function createConfigItems(label, name, value, type) {
        
        if (type === 'float') {
            var floatItem = new lx.component.Textbox({
                renderTo: templateSettingsDetailsSectionEl,
                label: label,
                labelAlign: 'left',
                margin: '15px 0px 0px 0px',
                labelWidth: '220px',
                maxWidth: '500px',
                
                onChange: function() {
                    confirmDestroy = true;
                }
            });
            floatItem.setValue(value);
            
            loanAgreementConfigItems.push({
                el: floatItem,
                type: type,
                label: name
            });
        }
        else if (type === 'color') {
            // Create the color picker item container
            var colorPickerItemContainerEl = lx.createElement('DIV', {
                parent: templateSettingsDetailsSectionEl,
                className: 'flex-row flex-align-center',
                style: {
                    margin: '15px 0px 0px 0px'
                }
            });
            
            // Create the color picker item label
            lx.createElement('DIV', {
                parent: colorPickerItemContainerEl,
                style: {
                    width: '220px',
                    fontSize: '12px'
                },
                innerHTML: label
            });
            
            // Create the color picker item
            var colorPickerItem = lx.createElement('INPUT', {
                parent: colorPickerItemContainerEl,
                type: 'color',
                style: {
                    maxWidth: '900px'
                }
            });
            colorPickerItem.value = value;
            
            colorPickerItem.addEventListener('change', function() {
                confirmDestroy = true;
            });
            
            // Save the color picker item
            loanAgreementConfigItems.push({
                el: colorPickerItem,
                type: type,
                label: name
            });
        }
        else if (type === 'image') {
            
            lx.createElement('DIV', {
                parent: templateSettingsDetailsSectionEl,
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: '900px',
                    padding: '15px 0px 0px 0px',
                    fontSize: '14px',
                    color: '#0F0F0F'
                },
                innerHTML: '<div>' + label + '</div>'
            });
            
            var wrapColumnLayout = new lx.component.ColumnLayout({
                renderTo: templateSettingsDetailsSectionEl
            });
            
            var loanAgreementImageEl = document.createElement('IMG');
            loanAgreementImageEl.style.margin = '15px 0px 0px 0px';
            loanAgreementImageEl.style.width = '100%';
            loanAgreementImageEl.style.height = '240px';
            loanAgreementImageEl.style.border = '0.1px solid #BABABA';
            loanAgreementImageEl.style.objectFit = 'contain';
            wrapColumnLayout.getContainer(1, 0).appendChild( loanAgreementImageEl );
            
            if (value !== '') {
                loanAgreementImageEl.src = value;
            }
            
            var uploadBtn = new lx.component.Button({
                renderTo: templateSettingsDetailsSectionEl,
                label: 'Choose File',
                width: '130px',
                margin: '20px 0px 0px auto'
                
            });
            uploadBtn.addEventListener('click', function() {
                if( uploadInputEl.click ) uploadInputEl.click();
                else if( uploadInputEl.dispatchEvent ) uploadInputEl.dispatchEvent( new Event('click') );
            });
            
            var uploadInputEl = document.createElement('INPUT');
            uploadInputEl.type = 'file';
            uploadInputEl.style.height = '1px';
            uploadInputEl.style.width = '1px';
            uploadInputEl.style.position = 'absolute';
            uploadInputEl.style.top = '-100px';
            uploadInputEl.style.left = '-100px';
            uploadInputEl.style.appearance = 'none';
            uploadInputEl.tabIndex = -1;
            uploadInputEl.addEventListener('change', function() {
                
                if (typeof uploadInputEl.files[0] != "undefined") {
                    if(uploadInputEl.files[0].size > 10000000) {
                        lx.showMessage({
                            title: 'Unable to upload file',
                            message: 'File size exceeds the 10mb limit.',
                            icon: 'icon_error'
                        });
                        return;
                    }
                }
                else {
                    return;
                }
                
                var files = uploadInputEl.files;
                
                for ( var i = 0; i < files.length; i++ ) {
                    
                    var file = files[i];
                    // returnFile = file;
                    
                    var imageType = /image.*/;
                    var img = loanAgreementImageEl;
                    
                    if ( !file.type.match(imageType) ) {
                        new lx.component.Messagebox({
                            title: 'Invalid file type',
                            message: 'Invalid file type. Please upload a image.'
                        });
                        return;
                    }
                    
                    
                    img.file = file;
                    var reader = new FileReader();
                    var imageFile = null;
                    reader.onload = ( function(aImg) {
                        return function(e) {
                            
                            aImg.src = e.target.result;
                            imageFile = uploadInputEl;
                            
                            var found = false;
                            for (var x = 0; x < loanAgreementImages.length; x++) {
                                if (loanAgreementImages[x].el === uploadInputEl) {
                                    loanAgreementImages[x].file = e.target.result;
                                    loanAgreementImages[x].imageName = name;
                                    loanAgreementImages[x].el = uploadInputEl;
                                    found = true;
                                }
                            }
                            
                            if (!found) {
                                loanAgreementImages.push({
                                    file: e.target.result,
                                    imageName: name,
                                    el: uploadInputEl
                                });
                                confirmDestroy = true;
                            }
                        }; 
                    })(img);
                    reader.readAsDataURL(file);
                }
            });
            loanAgreementImageEl.appendChild( uploadInputEl );
            
            loanAgreementConfigItems.push({
                el: uploadInputEl,
                type: type,
                label: name
            });
        }
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
            
            loanAgreementTemplateId: null
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
            innerHTML: 'Edit Loan Agreement Template Settings: ' + config.loanAgreementTemplateName
        });
        
        // Create the contentEl element
        contentContainerEl = lx.createElement('DIV', {
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
            renderTo: contentContainerEl
        });
        
        
        //
        // TEMPLATE SETTINGS DETAILS SECTION
        //
        
        // Create detailsSectionEl element
        templateSettingsDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
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
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the previewLoanAgreementBtn component
        previewLoanAgreementBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Preview',
            width: '120px',
            
            onClick: previewLoanAgreementBtnEventHandler
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            margin: '0px 0px 0px auto',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: saveBtnClickEventHandler
        });
        
        
        loadConfig();
        
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
        // detailsNameTxt.focus();
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
    
    
    // Preview button click event handler
    function previewLoanAgreementBtnEventHandler() {
        if (!loanAgreementImageDirExists) {
            new lx.component.Messagebox({
                title: 'System Error',
                message: 'Company directory not found. Please contact support'
            });
            return;
        }
        
        var configData = [];
        for (var i = 0; i < loanAgreementConfigItems.length; i++) {
            if(loanAgreementConfigItems[i].type === 'float') {
                if (isNaN(loanAgreementConfigItems[i].el.getValue())) {
                    new lx.component.Messagebox({
                        title: 'Unable to preview pdf',
                        message: loanAgreementConfigItems[i].label + ' field needs to be a number'
                    });
                    return;
                }
                
                configData.push({
                    type: loanAgreementConfigItems[i].type,
                    value: loanAgreementConfigItems[i].el.getValue(),
                    label: loanAgreementConfigItems[i].label
                });
            }
            else if(loanAgreementConfigItems[i].type === 'color') {
                configData.push({
                    type: loanAgreementConfigItems[i].type,
                    value: loanAgreementConfigItems[i].el.value,
                    label: loanAgreementConfigItems[i].label
                });
            }
            else if(loanAgreementConfigItems[i].type === 'image') {
                if( loanAgreementImages !== null ) {
                    for (var x = 0; x < loanAgreementImages.length; x++) {
                        if(loanAgreementImages[x].el === loanAgreementConfigItems[i].el) {
                            configData.push({
                                type: loanAgreementConfigItems[i].type,
                                value: loanAgreementImages[x].file,
                                label: loanAgreementConfigItems[i].label
                            });
                        }
                    }
                }
            }
        }
        
        lx.sendForm({
            url: 'exec.php?c=LoanAgreementConfig&fn=downloadLoanAgreementPreview',
            target: '_blank',
            data: {
                loanAgreementTemplateId: config.loanAgreementTemplateId,
                configData: configData
            }
        });
        

        
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        if (!loanAgreementImageDirExists) {
            new lx.component.Messagebox({
                title: 'System Error',
                message: 'Company directory not found. Please contact support'
            });
            return;
        }
        
        var configData = [];
        for (var i = 0; i < loanAgreementConfigItems.length; i++) {
            if(loanAgreementConfigItems[i].type === 'float') {
                if (isNaN(loanAgreementConfigItems[i].el.getValue())) {
                    new lx.component.Messagebox({
                        title: 'Unable to preview pdf',
                        message: loanAgreementConfigItems[i].label + ' field needs to be a number'
                    });
                    return;
                }
                
                configData.push({
                    type: loanAgreementConfigItems[i].type,
                    value: loanAgreementConfigItems[i].el.getValue(),
                    label: loanAgreementConfigItems[i].label
                });
            }
            else if(loanAgreementConfigItems[i].type === 'color') {
                configData.push({
                    type: loanAgreementConfigItems[i].type,
                    value: loanAgreementConfigItems[i].el.value,
                    label: loanAgreementConfigItems[i].label
                });
            }
            else if(loanAgreementConfigItems[i].type === 'image') {
                if( loanAgreementImages !== null ) {
                    for (var x = 0; x < loanAgreementImages.length; x++) {
                        if(loanAgreementImages[x].el === loanAgreementConfigItems[i].el) {
                            configData.push({
                                type: loanAgreementConfigItems[i].type,
                                value: loanAgreementImages[x].file,
                                label: loanAgreementConfigItems[i].label
                            });
                        }
                    }
                }
            }
        }
        
        lx.sendJSON({
            url: 'exec.php?c=LoanAgreementConfig&fn=updateLoanAgreementTemplatesConfig',
            data: {
                loanAgreementTemplateId: config.loanAgreementTemplateId,
                configData: configData
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                confirmDestroy = false;
                me.fireEvent('save', {srcPanel: me});
            }
        });
        
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};