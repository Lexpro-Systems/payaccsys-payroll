/* globals app, lx */
'use strict';


// EXPORT UIF DECLARATION PANEL
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
//  onExport            This event is fired after the reconciliation has been successfully exported.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ExportUifDeclaration = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var noteSectionEl = null;
    
    var fileNumberSectionEl = null;
    var fileNumberInfoTooltip = null;
    var fileNumberTxt = null;
    var exportedOnDisplay = null;
    
    var disclaimerSectionEl = null;
    var disclaimerDisplay = null;
    var disclaimerCb = null;
    var typeSelect = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var exportBtnContainerEl = null;
    var exportBtn = null;
    
    var payrunId = null;
    var startDate = null;
    var endDate = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the next file number
    function loadFileNumber() {
        loader.show();
        
        lx.sendJSON({
            url: 'exec.php?c=UifDeclaration&fn=getFileNumber',
            data: {
                payrunId: payrunId,
                startDate: startDate,
                endDate: endDate
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                loader.hide();
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading File Number Failed',
                        message: response.error
                    });
                }
                
                // Set the file number
                fileNumberTxt.setValue(('00' + response.fileNumber).slice(-3));
                if( response.exportedOn !== null ) {
                    // exportedOnDisplay.innerHTML = 'Last exported on: ' + (response.exportedOn.substring(0, 10));
                    exportedOnDisplay.setValue(response.exportedOn);//.substring(0, 10));
                }
                else {
                    // exportedOnDisplay.innerHTML = 'Last exported on: -';
                    exportedOnDisplay.setValue('-');
                }
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
            
            payrunId: null,
            startDate: null,
            endDate: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onExport') ) me.addEventListener('export', compConfig.onExport);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        startDate = compConfig.startDate;
        endDate = compConfig.endDate;
        
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
            innerHTML: 'Export UIF Declaration'
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
        // NOTE SECTION
        //
        
        // Create note section
        noteSectionEl = lx.createElement('DIV', {
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
        
        // // Create a heading for the note
        // new lx.component.Heading({
        //     renderTo: noteSectionEl,
        //     label: 'PLEASE NOTE:',
        //     boxSizing: 'border-box',
        //     display: 'flex',
        //     flexDirection: 'row',
        //     alignItems: 'center',
        //     justifyContent: 'space-between',
        //     width: '100%',
        //     maxWidth: '900px',
        //     padding: '0px 0px 0px 0px',
        //     fontSize: '16px'
        // });
        
        new lx.createElement('DIV', {
            // disclaimerDisplay = new lx.component.Display({
            parent: noteSectionEl,
            style: {
                textAlign: 'justify',
                margin: '0px 0px 0px 0px',
                padding: '0px'
            },
            innerHTML:
                'This function will generate a UIF declaration file that may be be submitted electronically as an attachment via e-mail to: <a href="mailto:declarations@labour.gov.za">declarations@labour.gov.za</a>.<br><br>' +
                'The &quot;Subject&quot; of the e-mail must be &quot;<b>Declaration</b>&quot; or &quot;<b>Declarations</b>&quot;.<br><br>' +
                'Please note that only the file will be generated and that submission via e-mail will not take place automatically.'
        });
        
        
        //
        // DECLARTION NUMBER SECTION
        //
        
        // Create file number section
        fileNumberSectionEl = lx.createElement('DIV', {
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
        
        // new lx.createElement('DIV', {
        //     // disclaimerDisplay = new lx.component.Display({
        //     parent: fileNumberSectionEl,
        //     style: {
        //         textAlign: 'justify',
        //         margin: '0px 0px 0px 0px',
        //         padding: '0px'
        //     },
        //     innerHTML:
        //         'The file number is a 3 digit numeric number, which serves to make the file name unique where more that one file is ' +
        //         'submitted under the same UIF reference number. In the normal course of events, this file number can be incremented ' +
        //         'by 1 each time a submission is made for subsequent months, or if an additional submission is made in order to ' + 
        //         'resubmit records that were rejected in a previous submission.<br><br>' +
        //         'It is important to know that if a file is sent more than once with the same file name, the last file received will ' +
        //         'be used, and it will overwrite all previously sent files with the same file name.'
        // });
        
        let fileNumberContainerEl = new lx.createElement('DIV', {
            parent: fileNumberSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: 'auto 0px auto 0px',
                // width: '23px'
            }
        });
        
        // Create the fileNumberTxt control
        fileNumberTxt = new lx.component.Textbox({
            renderTo: fileNumberContainerEl,
            margin: '0px 0px 0px 0px',
            label: 'File Number *',
            labelAlign: 'left',
            labelWidth: '120px',
            maxWidth: '600px',
            flex: '1 1 100%',
            
            onBlur: function( event ) {
                let value = parseInt(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    value = ('00' + value).slice(-3);
                    event.srcComponent.setValue(value);
                }
                else {
                    event.srcComponent.setValue( '001' );
                }
            }
        });
        fileNumberTxt.setValue('');
        
        // Create an info icon
        let fileNumberInfoEl = new lx.createElement('DIV', {
            parent: fileNumberContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        fileNumberInfoEl.addEventListener('mouseenter', function() { fileNumberInfoTooltip.show(); });
        fileNumberInfoEl.addEventListener('mouseleave', function() { fileNumberInfoTooltip.hide(); });
        
        // Create the tooltipLocusEl element
        let tooltipLocusEl = lx.createElement('DIV', {
            parent: fileNumberContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create editB4iDetailsBtnTooltip element
        fileNumberInfoTooltip = new lx.component.Tooltip({
            renderTo: tooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'The file number is a 3 digit numeric number, which serves to make the file name unique where more that one file is ' +
                    'submitted under the same UIF reference number. In the normal course of events, this file number can be incremented ' +
                    'by 1 each time a submission is made for subsequent months, or if an additional submission is made in order to ' + 
                    'resubmit records that were rejected in a previous submission.<br><br>' +
                    'It is important to know that if a file is sent more than once with the same file name, the last file received will ' +
                    'be used, and it will overwrite all previously sent files with the same file name.<br><br>' +
                    'PLEASE NOTE: The displayed file number has already been incremented if the declaration has never been ' +
                    'exported before.' +
                '</span>'
        });
        
        // Create the exportedOnDisplay element
        exportedOnDisplay = new lx.component.Display({
            renderTo: fileNumberSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Last Exported On',
            labelAlign: 'left',
            labelWidth: '120px',
            width: '100%',
            fontSize: '12px'
        });
        exportedOnDisplay.setValue('-');
        
        
        //
        // DISCLAIMER SECTION
        //
        
        // Create example section
        disclaimerSectionEl = lx.createElement('DIV', {
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
        
        // Create a heading for the disclaimer
        new lx.component.Heading({
            renderTo: disclaimerSectionEl,
            label: 'DISCLAIMER:',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '900px',
            padding: '0px 0px 0px 0px',
            fontSize: '16px'
        });
        
        // Create the disclaimerDisplay component
        disclaimerDisplay = new lx.createElement('DIV', {
        // disclaimerDisplay = new lx.component.Display({
            parent: disclaimerSectionEl,
            style: {
                textAlign: 'justify',
                margin: '15px 0px 0px 0px',
                padding: '0px'
            },
            innerHTML:
                'Whilst we do our utmost to ensure that the information contained in the ' +
                'UIF declaration is correct and accurate, it is the user&#39;s responsibility to ' +
                'check and ensure the accuracy of the information and Lexpro Systems (Pty) Ltd ' + 
                'will not be held accountable for any loss or damages due to the aforementioned ' +
                'submissions.'
        });
        
        // Create the disclaimerCb component
        disclaimerCb = new lx.component.Checkbox({
            renderTo: disclaimerSectionEl,
            label: 'I have read and understood the disclaimer',
            labelAlign: 'right',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            isChecked: false
        });
        
        // Create the typeSelect component
        typeSelect = new lx.component.Selectbox({
            renderTo: disclaimerSectionEl,
            label: 'Type',
            margin: '15px 0px 0px 0px'
        });
        typeSelect.addItems([
            { value: 'TEST', text: 'Test' },
            { value: 'LIVE', text: 'Live' }
        ]);
        typeSelect.setValue( 'TEST', 'Test' );
        
        
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
        
        // Create the exportBtnContainerEl element
        exportBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the exportBtn component
        exportBtn = new lx.component.Button({
            renderTo: exportBtnContainerEl,
            label: 'Export',
            width: '120px',
            
            onClick: exportBtnClickEventHandler
        });
        
        // Load the appropriate file number
        loadFileNumber();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Save it to the new renderTo element
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
        fileNumberTxt.focus();
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
    
    // Export button click event handler
    function exportBtnClickEventHandler() {
        // Check that disclaimer was accepted
        if( (fileNumberTxt.getValue() < 1) || (fileNumberTxt.getValue() > 999) ) {
            exportBtn.showWarning('Invalid file number. File number must be in the range of 1 to 999.');
            return;
        }
        else if( !disclaimerCb.getValue() ) {
            new lx.component.Messagebox({
                title: 'Disclaimer not checked',
                message: 'Please indicate whether you have read and understood the disclaimer before exporting.'
            });
            return;
        }
        
        // Check whether the declaration will export correctly
        lx.sendJSON({
            url: 'exec.php?c=UifDeclaration&fn=validate',
            data: {
                fileNumber: fileNumberTxt.getValue(),
                type: typeSelect.getValue(),
                payrunId: payrunId,
                startDate: startDate,
                endDate: endDate
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Exporting UIF Decalaration Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Export the UIF declaration
                lx.sendForm({
                    url: 'exec.php?c=UifDeclaration&fn=export',
                    target: '_self',
                    data: {
                        fileNumber: fileNumberTxt.getValue(),
                        type: typeSelect.getValue(),
                        payrunId: payrunId,
                        startDate: startDate,
                        endDate: endDate
                    }
                });
                
                me.fireEvent('export', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};