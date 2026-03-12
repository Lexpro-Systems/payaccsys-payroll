/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW DOCUMENT SETUP PANEL
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
app.panel.ViewDocumentSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentContainerEl = null;
    var templateSelectDetailsHeadingEl = null;
    var templateSelectDetailsSectionEl = null;
    var documentSelect = null;
    var templateSelect = null;
    
    var templateSettingsDetailsHeadingEl = null;
    var templateSettingsDetailsEditBtn = null;
    var templateSettingsDetailsSectionEl = null;
    
    var payslipImageDirExists = false;
    var loanAgreementImageDirExists = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load payslip templates
    function loadPayslipTemplates() {
        lx.sendJSON({
            url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesList',
            onSuccess: function( responseText ) {
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Templates Failed',
                        message: response.error
                    });
                }
                
                var payslipTemplates = [];
                for( var i = 0; i < response.payslipTemplates.length; i++ ) {
                    if (response.payslipTemplates[i].currentTemplate) {
                        templateSelect.setValue(response.payslipTemplates[i].id, response.payslipTemplates[i].description);
                    }
                    payslipTemplates.push({
                        value: response.payslipTemplates[i].id,
                        text: response.payslipTemplates[i].description
                    });
                }
                templateSelect.addItems( payslipTemplates );
                
                templateSelectOnChangeEvent();
            }
        });
    }
    
    // Function to load loan agreement templates
    function loadLoanAgreementTemplates() {
        lx.sendJSON({
            url: 'exec.php?c=LoanAgreementConfig&fn=getLoanAgreementTemplatesList',
            onSuccess: function( responseText ) {
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Loan Agreement Templates Failed',
                        message: response.error
                    });
                }
                
                var loanAgreementTemplates = [];
                for( var i = 0; i < response.loanAgreementTemplates.length; i++ ) {
                    if (response.loanAgreementTemplates[i].currentTemplate) {
                        templateSelect.setValue(response.loanAgreementTemplates[i].id, response.loanAgreementTemplates[i].description);
                    }
                    loanAgreementTemplates.push({
                        value: response.loanAgreementTemplates[i].id,
                        text: response.loanAgreementTemplates[i].description
                    });
                }
                templateSelect.addItems( loanAgreementTemplates );
                
                templateSelectOnChangeEvent();
            }
        });
    }
    
    // Function to create template configuration items
    function createConfigItems(label, value, type) {
        if (type === 'float') {
            // Create a container for the component as well as the info icon
            let floatItemContainerEl = new lx.createElement('DIV', {
                parent: templateSettingsDetailsSectionEl,
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    margin: '15px 0px 0px 0px'
                }
            });
            
            // Display the float item
            let floatItem = new lx.component.Display({
                renderTo: floatItemContainerEl,
                label: label,
                labelAlign: 'left',
                margin: '0px 0px 0px 0px',
                labelWidth: '220px',
                maxWidth: '315px',
            });
            floatItem.setValue(value);
            if (value === null || value === '') {
                floatItem.setValue('-');
            }
            
            // // Is the item the logo coordinates?
            // if( (label === 'Logo X') || (label === 'Logo Y') ) {
            //     // Create the element used to position the tooltip
            //     let floatItemTooltipLocusEl = lx.createElement('DIV', {
            //         parent: floatItemContainerEl,
            //         style: {
            //             position: 'relative',
            //             margin: 'auto 0px 0px 0px',
            //             width: '0px',
            //             height: '30px'
            //         }
            //     });
                
            //     // Create an info icon
            //     let floatItemInfoEl = new lx.createElement('DIV', {
            //         parent: floatItemContainerEl,
            //         style: {
            //             cursor: 'pointer',
            //             display: 'flex',
            //             width: '24px',
            //             minWidth: '24px',
            //             height: '24px',
            //             minHeight: '24px',
            //             margin: 'auto 0px auto 0px',
            //             fontSize: '12px',
            //             color:  lx.style.global.backgroundColor,
            //             backgroundColor: '#3B81EB',
            //             borderRadius: '50%'
            //         },
            //         innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
            //     });
                
            //     // Set the info tooltip message depedning on the item
            //     let message = '';
            //     if( label === 'Logo X' ) {
            //         message = 
            //             '<span style="font-size: 12px;">' +  
            //                 'The number of units the logo will be positioned from the left of the payslip.' +
            //             '</span>';
            //     }
            //     else if( label === 'Logo Y' ) {
            //         message = 
            //             '<span style="font-size: 12px;">' +  
            //                 'The number of units the logo will be positioned from the top of the payslip.' +
            //             '</span>';
            //     }
                
            //     // Create the tooltip component
            //     let floatItemInfoTooltip = new lx.component.Tooltip({
            //         renderTo: floatItemTooltipLocusEl,
            //         alignment: 'topLeft',
            //         arrowOffset: '8px',
            //         width: '100%',
            //         maxWidth: '300px',
            //         margin: '5px 10px',
            //         backgroundColor: '#3B81EB', // '#4885F4',
            //         message: message
            //     });
            //     floatItemInfoEl.addEventListener('mouseenter', function() { floatItemInfoTooltip.show(); });
            //     floatItemInfoEl.addEventListener('mouseleave', function() { floatItemInfoTooltip.hide(); });
            // }
        }
        else if (type === 'color') {
            // Create the color picker item
            var colorPickerItemContainerEl = lx.createElement('DIV', {
                parent: templateSettingsDetailsSectionEl,
                className: 'flex-row flex-align-center',
                style: {
                    margin: '15px 0px 0px 0px'
                }
            });
            
            lx.createElement('DIV', {
                parent: colorPickerItemContainerEl,
                style: {
                    width: '220px'
                },
                innerHTML: label
            });
            
            let colorPickerItem = lx.createElement('INPUT', {
                parent: colorPickerItemContainerEl,
                type: 'color',
                style: {
                    maxWidth: '900px'
                }
            });
            colorPickerItem.value = value;
            colorPickerItem.disabled = true;
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
            
            let wrapColumnLayout = new lx.component.ColumnLayout({
                renderTo: templateSettingsDetailsSectionEl
            });
            
            let payslipImageEl = document.createElement('IMG');
            payslipImageEl.style.margin = '15px 0px 0px 0px';
            payslipImageEl.style.minWidth = '200px';
            payslipImageEl.style.maxWidth = '100%';
            payslipImageEl.style.height = '200px';
            payslipImageEl.style.border = '0.1px solid #BABABA';
            payslipImageEl.style.objectFit = 'contain';
            wrapColumnLayout.getContainer(1, 0).appendChild( payslipImageEl );
            
            if (value !== '') {
                payslipImageEl.src = value;
            }
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
            
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('add', compConfig.onSave);
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
        
        
        //
        // PAYSLIP TEMPLATE DETAILS SECTION
        //
        
        templateSelectDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F',
                margin: '10px 0px 5px 0px'
            },
            innerHTML: '<div>Document Template</div>'
        });
        
        templateSelectDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        documentSelect = new lx.component.Selectbox({
            renderTo: templateSelectDetailsSectionEl,
            label: 'Document',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: documentSelectOnChangeEvent
        });
        var documents = [];
        documents.push({value: 'PAYS', text: 'Payslip'});
        documents.push({value: 'LOAN', text: 'Loan Agreement'});
        documentSelect.addItems( documents );
        documentSelect.setValue( 'PAYS', 'Payslip' );
        
        templateSelect = new lx.component.Selectbox({
            renderTo: templateSelectDetailsSectionEl,
            label: 'Template',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: templateSelectOnChangeEvent
        });
        
        
        //
        // TEMPLATE SETTINGS DETAILS SECTION
        //
        
        templateSettingsDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Template Settings</div>'
        });
        
        templateSettingsDetailsEditBtn = new lx.component.Button({
            renderTo: templateSettingsDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: templateSettingsDetailsEditBtnClickEventhandler
        });
        
        templateSettingsDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        loadPayslipTemplates();
        
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
        templateSelect.focus();
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
    
    function templateSettingsDetailsEditBtnClickEventhandler() {
        // Depending on the document selected
        if( documentSelect.getValue() === 'PAYS' ) {
            if (!payslipImageDirExists) {
                new lx.component.Messagebox({
                    title: 'System Error',
                    message: 'Company directory not found. Please contact support'
                });
                return;
            }
            
            // Create a modal window
            let editPayslipSetupModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '900px',
                maxHeight: '800px'
            });
            
            // Create the editPayslipSetupPanel panel
            let editPayslipSetupPanel = new app.panel.EditPayslipSetup({
                renderTo: editPayslipSetupModal.getContainer(),
                show: true,
                payslipTemplateId: templateSelect.getValue(),
                payslipTemplateName: templateSelect.getText(),
                
                onCancel: function() {
                    editPayslipSetupPanel.destroy();
                },
                onSave: function() {
                    editPayslipSetupPanel.destroy();
                    templateSettingsDetailsSectionEl.innerHTML = '';
                    templateSelect.clear();
                    loadPayslipTemplates();
                },
                onDestroy: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editPayslipSetupModal.addEventListener('destroy', function() {
            });
            
            // Create a route entry for the panel
            let state = {
                modal: editPayslipSetupModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editPayslipSetupModal.show();
            editPayslipSetupPanel.focus();
        }
        else if( documentSelect.getValue() === 'LOAN' ) {
            if (!loanAgreementImageDirExists) {
                new lx.component.Messagebox({
                    title: 'System Error',
                    message: 'Company directory not found. Please contact support'
                });
                return;
            }
            
            // Create a modal window
            let editLoanAgreementSetupModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '840px',
                maxHeight: '600px'
            });
            
            // Create the editLoanAgreementSetupPanel panel
            let editLoanAgreementSetupPanel = new app.panel.EditLoanAgreementSetup({
                renderTo: editLoanAgreementSetupModal.getContainer(),
                show: true,
                loanAgreementTemplateId: templateSelect.getValue(),
                loanAgreementTemplateName: templateSelect.getText(),
                
                onCancel: function() {
                    editLoanAgreementSetupPanel.destroy();
                },
                onSave: function() {
                    editLoanAgreementSetupPanel.destroy();
                    templateSettingsDetailsSectionEl.innerHTML = '';
                    templateSelect.clear();
                    loadLoanAgreementTemplates();
                },
                onDestroy: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editLoanAgreementSetupModal.addEventListener('destroy', function() {
            });
            
            // Create a route entry for the panel
            let state = {
                modal: editLoanAgreementSetupModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editLoanAgreementSetupModal.show();
            editLoanAgreementSetupPanel.focus();
        }
    }
    
    // The documentSelect change event handler
    function documentSelectOnChangeEvent() {
        templateSelect.clear();
        if( documentSelect.getValue() === 'PAYS' ) {
            loadPayslipTemplates();
        }
        else if( documentSelect.getValue() === 'LOAN' ) {
            loadLoanAgreementTemplates();
        }
    }
    
    // The templateSelect change event handler
    function templateSelectOnChangeEvent() {
        templateSettingsDetailsSectionEl.innerHTML = '';
        
        // Depending on the type of document
        if( documentSelect.getValue() === 'PAYS' ) {
            lx.sendJSON({
                url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesConfig',
                data: {
                    payslipTemplateId: templateSelect.getValue()
                },
                onSuccess: function( responseText ) {
                    
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Payslip Config Failed',
                            message: response.error
                        });
                    }
                    
                    payslipImageDirExists = response.clientDataDirExists;
                    if (!payslipImageDirExists) {
                        new lx.component.Messagebox({
                            title: 'System Error',
                            message: 'Company directory not found. Please contact support'
                        });
                    }
                    
                    for (var i = 0; i < response.templateConfig.length; i++) {
                        createConfigItems(response.templateConfig[i].description, response.templateConfig[i].value, response.templateConfig[i].type);
                    }
                }
            });
        }
        else if( documentSelect.getValue() === 'LOAN' ) {
            lx.sendJSON({
                url: 'exec.php?c=LoanAgreementConfig&fn=getLoanAgreementTemplatesConfig',
                data: {
                    loanAgreementTemplateId: templateSelect.getValue()
                },
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Loan Agreement Template Failed',
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
                        createConfigItems(response.templateConfig[i].description, response.templateConfig[i].value, response.templateConfig[i].type);
                    }
                }
            });
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};