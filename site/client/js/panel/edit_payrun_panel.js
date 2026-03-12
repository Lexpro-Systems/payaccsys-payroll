/* globals app, lx */
'use strict';

// EDIT PAYRUN PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  payrunId            The ID of the payrun to edit.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.EditPayrun = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var payslipsChanged = null;
    var payrunId = null;
    var payrunDescription = null;
    var payslips = null;
    var addedPayslipIds = [];
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var searchTxt = null;
    var refreshBtnEl = null;
    var processBtn = null;
    var saveBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var payslipSectionEl = null;
    var isProcessed = null;

    me.updatePayrunGrid = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Load description function
    function loadPayrunDescription() {
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getDescription',
            data: {
                payrunId: config.payrunId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payrun Failed',
                        message: response.error
                    });
                }
                
                titleTextEl.innerHTML = 'Edit Payrun: ' + response.payrunDescription;
            }
        });
    }
    
    // Function to load the payrun data
    function loadPayrun() {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=get',
            data: {
                payrunId: payrunId,
                payslipStatusCode: 'ACTI'
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payrun Failed',
                        message: response.error
                    });
                }
                
                // Clear all existing payslips
                payslips = [];
                
                // Remove all payslip elements
                payslipSectionEl.innerHTML = '';
                
                // Get the payrun
                var payrun = response.payrun;
                
                // Loop through each employee
                var payslip = null;
                var newPayslip = null;
                payslipsChanged = false;
                
                // Loop through all payslips
                for( var i = 0; i < payrun.payslips.length; i++ ) {
                    payslip = payrun.payslips[i];
                    
                    newPayslip = new app.panel.EditPayslip({
                        renderTo: payslipSectionEl,
                        width: '100%',
                        maxWidth: '900px',
                        margin: '15px 0px 0px 0px',
                        
                        payslip: payslip,
                        isProcessed: isProcessed,
                        
                        onChange: payslipEditorChangeEventHandler,
                        onItemAdd: payslipEditorChangeEventHandler,
                        onDelete: payslipEditorDeleteEventHandler,
                        onRecreate: payslipEditorRecreateEventHandler
                    });
                    
                    // Update the payslip items if the payrun has not been processed
                    if( !isProcessed ) {
                        // newPayslip.updateItems();
                        payslipsChanged = true;
                    }
                    
                    payslips.push( newPayslip );
                }
                
                // Were there no payslips to display?
                if( payrun.payslips.length <= 0 ) {
                    // Display a message to the user
                    let noteSectionEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderColor: '#DFDFDF',
                            borderWidth: '1px',
                            margin: 'auto 0px',
                            padding: '60px 90px',
                            width: '100%',
                            maxWidth: '900px',
                            boxSizing: 'border-box',
                            // borderRadius: '15px'
                        }
                    });
                    
                    new lx.createElement('DIV', {
                        parent: noteSectionEl,
                        style: {
                            margin: '0px 0px 0px 0px',
                            textAlign: 'center',
                            fontSize: '64px'
                        },
                        innerHTML: '<i class="fas fa-exclamation-triangle" style="margin: auto 10px auto 0px; color: #E75B54;"></i>'
                    });
                    
                    new lx.createElement('DIV', {
                        parent: noteSectionEl,
                        style: {
                            margin: '25px auto 0px auto',
                            // maxWidth: '700px',
                            textAlign: 'center',
                            fontSize: '18px'
                        },
                        innerHTML: 
                            'There are no employees payable for the given payrun period (' + payrun.fromDate + ' to ' +
                            payrun.toDate + '). <br><br>' + 
                            '<span style="font-size: 12px;"><b>Please note that a payrun will only include those employees whose ' +
                            '\'Payment Period End Date\' falls within the payrun period and aren\'t already included in ' + 
                            'another payrun for the given period.</b></span>'
                    });
                    
                    // Disable the relevant buttons
                    refreshBtnEl.disable();
                    processBtn.disable();
                    saveBtn.disable();
                }
                else {
                    // Enable the relevant buttons
                    if( !isProcessed ) {
                        refreshBtnEl.enable();
                        processBtn.enable();
                        saveBtn.enable();
                    }
                    else {
                        refreshBtnEl.disable();
                        processBtn.disable();
                        saveBtn.disable();
                    }
                }
                
                confirmDestroy = false;
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
            payrunDescription: '',
            isProcessed: false
        };
        
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onItemAdd') ) me.addEventListener('itemadd', compConfig.onItemAdd);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save_payrun', compConfig.onSave);
        if( compConfig.hasOwnProperty('onProcess') ) me.addEventListener('process_payrun', compConfig.onProcess);
        if (compConfig.hasOwnProperty('onUpdate')) me.addEventListener('update', compConfig.onUpdate);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        payrunDescription = compConfig.payrunDescription;
        isProcessed = compConfig.isProcessed;
    
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
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 20px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Edit Payrun: ' + compConfig.payrunDescription
        });
        
        // Create the search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        // Create an edit button
        refreshBtnEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '28px',
                minWidth: '28px',
                height: '28px',
                minHeight: '28px',
                margin: 'auto 0px auto 20px',
                fontSize: '14px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#E75B54',
                borderRadius: '50%'
            },
            
            isEnabled: true,
            
            disable: function() {
                refreshBtnEl.style.backgroundColor = '#C0C0C0';
                refreshBtnEl.isEnabled = false;
            },
            
            enable: function() {
                refreshBtnEl.style.backgroundColor = '#E75B54';
                refreshBtnEl.isEnabled = true;
            },
            
            innerHTML: '<i class="fa fa-redo" style="margin: auto auto;"></i>'
        });
        refreshBtnEl.addEventListener('click', refreshBtnElClickEventHandler);
        if( isProcessed ) refreshBtnEl.disable();
        
        // Create the refreshBtnTooltipLocusEl element
        let refreshBtnTooltipLocusEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                position: 'relative',
                width: '0px',
                height: '28px'
            }
        });
        
        // Create refreshBtnTooltip element
        let refreshBtnTooltip = new lx.component.Tooltip({
            renderTo: refreshBtnTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '10px',
            width: '100%',
            maxWidth: '265px',
            padding: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 10px;">Refresh payrun calculations</span>'
        });
        refreshBtnEl.addEventListener('mouseenter', function() { if( refreshBtnEl.isEnabled) refreshBtnTooltip.show(); });
        refreshBtnEl.addEventListener('mouseleave', function() { refreshBtnTooltip.hide(); });
        
        // Create the processBtn component
        processBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Process',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 20px',
            
            onClick: processBtnClickEventHandler
        });
        if( isProcessed ) processBtn.disable();
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Save',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 0px',
            
            onClick: saveBtnClickEventHandler
        });
        if( isProcessed ) saveBtn.disable();
        
// console.log( isProcessed );
        
        // Create the menu dropdown button
        var menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: titleContainerEl,
            margin: '0px 10px 0px 0px',
            label: '<i class="fa fa-ellipsis-v"></i>',
            width: '15px',
            dropdownAlignment: 'right'
        });
        
        // Create the menuDropDownBtnAddPayslipsEl element
        var menuDropDownBtnAddPayslipsEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '210px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-plus" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Add Payslips</span>'
        });
        menuDropDownBtnAddPayslipsEl.addEventListener('click', menuDropDownBtnAddPayslipsElClickEventHandler);
        if( isProcessed ) {
            lx.applyStyle(menuDropDownBtnAddPayslipsEl, {color: lx.style.global.disabledColor});
        }
        
        // Create the menuDropEditDescriptionEl element
        var menuDropEditDescriptionEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '210px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit Description</span>'
        });
        menuDropEditDescriptionEl.addEventListener('click', menuDropEditDescriptionElClickEventHandler);
        
        // Create the menuDropDownBtnDownloadReportEl element
        var menuDropDownBtnDownloadReportEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '210px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-file-download" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Download Report</span>'
        });
        menuDropDownBtnDownloadReportEl.addEventListener('click', menuDropDownBtnDownloadReportElClickEventHandler);
        
        // Create the menuDropDownBtnEmailPayslipsEl element
        var menuDropDownBtnEmailPayslipsEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '210px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-envelope" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Email Payslips</span>'
        });
        menuDropDownBtnEmailPayslipsEl.addEventListener('click', menuDropDownBtnEmailPayslipsElClickEventHandler);
        if( !isProcessed ) {
            lx.applyStyle(menuDropDownBtnEmailPayslipsEl, {color: lx.style.global.disabledColor});
        }
        
        // Create the menuDropDownBtnPostLexproEl element
        // var menuDropDownBtnPostLexproEl = lx.createElement('DIV', {
        //     parent: menuDropdownBtn.getContainer(),
        //     className: 'list-item',
        //     style: {
        //         width: '210px',
        //         padding: '10px 10px',
        //         borderStyle: 'solid',
        //         borderWidth: '0px 0px 0px 3px'
        //     },
        //     innerHTML: '<i class="fa fa-fw fa-external-link-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Post to Lexpro Accounting</span>'
        // });
        // menuDropDownBtnPostLexproEl.addEventListener('click', menuDropDownBtnPostLexproElClickEventHandler);
        // if( !isProcessed ) {
        //     lx.applyStyle(menuDropDownBtnPostLexproEl, {color: lx.style.global.disabledColor});
        // }
        

        // Create the menuDropDownBtnPayeOverDeductionCreditEl element
        var menuDropDownBtnPayeOverDeductionCreditEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '210px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-calculator" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">PAYE Over-Deduction Credit</span>'
        });
        menuDropDownBtnPayeOverDeductionCreditEl.addEventListener('click', menuDropDownBtnPayeOverDeductionCreditElClickEventHandler);
        // if( !isProcessed ) {
        //     lx.applyStyle(menuDropDownBtnPayeOverDeductionCreditEl, {color: lx.style.global.disabledColor});
        // }
        
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
        // PAYSLIP SECTION
        //
        
        payslipSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }
        });
        
        // Load the payrun
        loadPayrun();
        loadPayrunDescription();
        
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
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        me.fireEvent('cancel', null);
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        // Was no search value specified?
        if( searchTxt.getValue().trim() === '' ) {
            // Show all the payslips
            for (let i = 0; i < payslips.length; i++) {
                payslips[i].show();
            }
            return;
        }
        
        var searchString = searchTxt.getValue().trim().toLowerCase();
        
        // Show only the payslips matching the search value
        for( let i = 0; i < payslips.length; i++ ) {
            var employeeName = payslips[i].getEmployeeName().toLowerCase();
            
            if( employeeName.search(searchString) !== -1 ) {
                payslips[i].show();
            }
            else {
                payslips[i].hide();
            }
        }
    }
    
    function onSearchResetBtnClickEventHandler() {
        // Show all the payslips
        searchTxt.setValue('');
        for (var i = 0; i < payslips.length; i++) {
            payslips[i].show();
        }
    }
    
    // refreshBtnEl click event handler
    function refreshBtnElClickEventHandler() {
        // Is the refresh button enabled?
        if( !refreshBtnEl.isEnabled ) return;
        
        // Ask user permission to continue to process the payrun, and process
        new lx.component.Messagebox({
            title: 'Refresh Payrun Calculations',
            message: 
                'All payrun items that are automatically calculated (i.e., all grey items) will be re-calculated. ' + 
                'Are you certain you wish to continue?',
            buttons: [
                {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                {name: 'refresh', label: 'Refresh', isDefault: true}
            ],
            onClose: function( closeEvent ) {
                // Should the payrun be processed?
                if( closeEvent.button === 'refresh' ) {
                    // Show the loader
                    loader.show(false);
                    
                    // Get all the payslips for the specified employee
                    var employeePayslips = [];
                    var employeeId = null;
                    for( let i = 0; i < payslips.length; i++ ) {
                        if( payslips[i].getEmployeeId() !== employeeId ) {
                            if( employeeId !== null ) {
                                // Update payslip items
                                lx.sendJSON({
                                    url: 'exec.php?c=Payrun&fn=calculatePayslips',
                                    data: {
                                        payslips: employeePayslips
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse( responseText );
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Refresh Payrun Calculations Failed',
                                                message: response.error
                                            });
                                            loader.hide();
                                            return;
                                        }
                                        
                                        // Update all the relevant payslips
                                        for( let i = 0; i < response.payslips.length; i++ ) {
                                            // find the index of the payslip to be updated
                                            let payslipIndex = null;
                                            for( let j = 0; j < payslips.length; j++ ) {
                                                if( payslips[j].getPayslipId() ==  response.payslips[i].id ) {
                                                    payslipIndex = j;
                                                }
                                            }
                                            
                                            // Payslip was not found, skip the rest
                                            if( payslipIndex === null ) continue;
                                            
                                            // Update all the payslip items of the specified payslip
                                            for( let j = 0; j < response.payslips[i].items.length; j++ ) {
                                                payslips[payslipIndex].updateItem(j, '', response.payslips[i].items[j].units, response.payslips[i].items[j].rate, response.payslips[i].items[j].amount);
                                            }
                                        }
                                    }
                                });
                            }
                            
                            employeeId = payslips[i].getEmployeeId();
                            employeePayslips = [];
                        }
                        
                        // Dees the payslip belong to the specified emoloyee?
                        if( payslips[i].getEmployeeId() ==  employeeId ) {
                            // Convert the payslip to an object
                            let employeePayslip = payslips[i].toObject();
                            
                            // Do not send any deleted items.
                            for( let j = employeePayslip.items.length - 1; j >= 0; j-- ) {
                                if( employeePayslip.items[j]['delete'] === true ) employeePayslip.items.splice(j, 1);
                            }
                            
                            // Save the payslips to be sent
                            employeePayslips.push(employeePayslip);
                        }
                    }
                    
                    // Update the last employees payslips
                    lx.sendJSON({
                        url: 'exec.php?c=Payrun&fn=calculatePayslips',
                        data: {
                            payslips: employeePayslips
                        },
                        onSuccess: function( responseText ) {
                            loader.hide();
                            var response = JSON.parse( responseText );
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Refresh Payrun Calculations Failed',
                                    message: response.error
                                });
                                return;
                            }
                            
                            // Update all the relevant payslips
                            for( let i = 0; i < response.payslips.length; i++ ) {
                                // find the index of the payslip to be updated
                                let payslipIndex = null;
                                for( let j = 0; j < payslips.length; j++ ) {
                                    if( payslips[j].getPayslipId() ==  response.payslips[i].id ) {
                                        payslipIndex = j;
                                    }
                                }
                                
                                // Payslip was not found, skip the rest
                                if( payslipIndex === null ) continue;
                                
                                // Update all the payslip items of the specified payslip
                                for( let j = 0; j < response.payslips[i].items.length; j++ ) {
                                    payslips[payslipIndex].updateItem(j, '', response.payslips[i].items[j].units, response.payslips[i].items[j].rate, response.payslips[i].items[j].amount);
                                }
                            }
                        }
                    });
                    
                    // Remember that changes have been made
                    payslipsChanged = true;
                    confirmDestroy = true;
                }
            }
        });
    }
    
    // payslipEditor change event handler
    function payslipEditorChangeEventHandler( event ) {
        payslipsChanged = true;
        confirmDestroy = true;
        
        // Get the payslip data
        // var payslip = event.srcComponent.toObject();
        
        // Get all the payslips for the specified employee
        var employeePayslips = [];
        for( let i = 0; i < payslips.length; i++ ) {
            // Dees the payslip belong to the specified emoloyee?
            if( payslips[i].getEmployeeId() ==  event.srcComponent.getEmployeeId() ) {
                // Convert the payslip to an object
                let employeePayslip = payslips[i].toObject();
                
                // Do not send any deleted items.
                for( let j = employeePayslip.items.length - 1; j >= 0; j-- ) {
                    if( employeePayslip.items[j]['delete'] === true ) employeePayslip.items.splice(j, 1);
                }
                
                // Save the payslips to be sent
                employeePayslips.push(employeePayslip);
            }
        }
        
        // Update payslip items
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=calculatePayslips',
            data: {
                payslips: employeePayslips
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Calculating Payslip Items Failed',
                        message: response.error
                    });
                }
                
                // Update all the relevant payslips
                for( let i = 0; i < response.payslips.length; i++ ) {
                    // find the index of the payslip to be updated
                    let payslipIndex = null;
                    for( let j = 0; j < payslips.length; j++ ) {
                        if( payslips[j].getPayslipId() ==  response.payslips[i].id ) {
                            payslipIndex = j;
                        }
                    }
                    
                    // Payslip was not found, skip the rest
                    if( payslipIndex === null ) continue;
                    
                    // Update all the payslip items of the specified payslip
                    for( let j = 0; j < response.payslips[i].items.length; j++ ) {
                        payslips[payslipIndex].updateItem(j, '', response.payslips[i].items[j].units, response.payslips[i].items[j].rate, response.payslips[i].items[j].amount);
                    }
                }
            }
        });
    }
    
    // payslipEditor delete event handler
    function payslipEditorDeleteEventHandler( event ) {
        // Delete the specified payslip
        event.srcComponent.deletePayslip();
        
        payslipsChanged = true;
        confirmDestroy = true;
    }
    
    // payslipEditor recreate event handler
    function payslipEditorRecreateEventHandler( event ) {
        payslipsChanged = true;
        confirmDestroy = true;
        
        // Get the payslip data
        var payslip = event.srcComponent.toObject();
        
        // Recreate the payslip items
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=recreatePayslipItems',
            data: {
                payslipId: payslip.id
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Recreating Payslip Failed',
                        message: response.error
                    });
                }
                
                // Replace the existing items with the new ones
                event.srcComponent.replaceItems( response.payslipItems );
                
                confirmDestroy = true;
            }
        });
    }
    
    // saveBtn click event handler
    function saveBtnClickEventHandler() {

        // Get all the payslip objects
        var payslipObjects = [];
        for (var i = 0; i < payslips.length; i++) {
            payslipObjects.push( payslips[i].toObject() );
        }
        
        // Set payrun data to be updated
        var payrun = {
            id: payrunId,
            payslips: payslipObjects
        };
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Update the selected payrun
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=update',
            data: {
                payrun: payrun
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
                me.fireEvent('save_payrun', {srcPanel: me});
            }
        });
    }
    
    // processBtn click event handler
    function processBtnClickEventHandler() {
        // Check if all payslips have been completed and that there are no empty payslips
        for (var i = 0; i < payslips.length; i++) {
            // Get the payslip object
            var payslip = payslips[i].toObject();
            
            // Don't check deleted items
            if( payslip.delete === true ) continue;
            
            // Is the payslip empty?
            if( payslips[i].isEmpty() ) {
                new lx.component.Messagebox({
                    title: 'Cannot Process Payrun',
                    message: 'The payrun cannot be processed because the payslip for \'' + payslip.employee.name + 
                        '\' for the period \'' + payslip.fromDate + ' - ' + payslip.toDate + 
                        '\' has no payslip items.'
                });
                return;
            }
            
            // Is the payslip incomplete?
            if( !payslips[i].isComplete() ) {
                new lx.component.Messagebox({
                    title: 'Cannot Process Payrun',
                    message: 'The payrun cannot be processed because the payslip for \'' + payslip.employee.name + 
                        '\' for the period \'' + payslip.fromDate + ' - ' + payslip.toDate + 
                        '\' is not complete.'
                });
                return;
            }
        }
        
        // Has the payslip changed?
        if( payslipsChanged !== false ) {
            // Ask user permission to continue to process the payrun, and process
            new lx.component.Messagebox({
                message: 
                    'Any changes to the payrun will be saved if you choose to continue with processing the payrun. Are you certain you wish to process the payrun?',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'process', label: 'Process', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the payrun be processed?
                    if( closeEvent.button === 'process' ) {
                        // Get all the payslip objects
                        var payslipObjects = [];
                        for (let i = 0; i < payslips.length; i++) {
                            payslipObjects.push( payslips[i].toObject() );
                        }
                        
                        // Set payrun data to be updated
                        var payrun = {
                            id: payrunId,
                            payslips: payslipObjects
                        };
                        
                        saveBtn.disable();
                        
                        // Update the selected payrun
                        lx.sendJSON({
                            url: 'exec.php?c=Payrun&fn=update',
                            data: {
                                payrun: payrun
                            },
                            onSuccess: function( responseText ) {
                                processBtn.hideLoader();
                                refreshBtnEl.enable();
                                processBtn.enable();
                                saveBtn.enable();
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Saving Payrun Failed',
                                        message: response.error
                                    });
                                    
                                    return;
                                }
                                
                                // Re-load the payrun
                                loadPayrun();
                                
                                // Create a modal window
                                var processPayrunModal = new lx.component.ModalWindow({
                                    margin: '40px',
                                    maxWidth: '900px',
                                    maxHeight: '100%'
                                });
                                
                                // Create the processPayrunPanel panel
                                var processPayrunPanel = new app.panel.ProcessPayrun({
                                    renderTo: processPayrunModal.getContainer(),
                                    show: true,
                                    
                                    payrunId: parseInt(payrunId),
                                    
                                    onProcess: function() {
                                        // Close the popup
                                        app.route.popState();
                                        
                                        // Back to the list payrun panel
                                        confirmDestroy = false;
                                        me.fireEvent('process_payrun', {srcPanel: me});
                                    },
                                    
                                    onCancel: function() {
                                        // Close the popup
                                        app.route.popState();
                                    }
                                });
                                
                                // Add destroy event listener to modal to destroy the contained panel.
                                processPayrunModal.addEventListener('destroy', function() {
                                    processPayrunPanel.destroy();
                                });
                                
                                // Create a route entry for the panel
                                let state = {
                                    modal: processPayrunModal
                                };
                                app.route.pushState(state, function( state ) {
                                    state.modal.destroy();
                                });
                                
                                // Show the modal window and focus on the panel
                                processPayrunModal.show();
                                processPayrunPanel.focus();
                            }
                        });
                    }
                    else {
                        return;
                    }
                }
            });
        }
        else {
            // Create a modal window
            var processPayrunModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '800px',
                maxHeight: '100%'
            });
            
            // Create the processPayrunPanel panel
            var processPayrunPanel = new app.panel.ProcessPayrun({
                renderTo: processPayrunModal.getContainer(),
                show: true,
                
                payrunId: parseInt(payrunId),
                
                onProcess: function() {
                    // Close the popup
                    app.route.popState();
                    
                    // Back to the list payrun panel
                    confirmDestroy = false;
                    me.fireEvent('process_payrun', {srcPanel: me});
                },
                
                onCancel: function() {
                    // Close the popup
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            processPayrunModal.addEventListener('destroy', function() {
                processPayrunPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: processPayrunModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            processPayrunModal.show();
            processPayrunPanel.focus();
        }
    }
    
    // menuDropDownBtnAddPayslipsEl click event handler
    function menuDropDownBtnAddPayslipsElClickEventHandler() {
        // Has the payrun already been processed?
        if( isProcessed ) {
            new lx.component.Messagebox({
                title: 'Add Payslips',
                message: 'The payrun cannot be changed because it has already been processed.'
            });
            return;
        }
        
        // Get an array of all the deleted payslips
        let deletedPayslips = [];
        for( let i = 0; i < payslips.length; i++ ) {
            let payslip = payslips[i].toObject();
            
            if( payslip.statusCode === 'DELE' ) {
                deletedPayslips.push(payslip);
            }
        }
        
        // Create a modal window
        var addPayslipsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '540px',
            maxHeight: '100%'
        });
        
        // Create the addPayslipsPanel panel
        var addPayslipsPanel = new app.panel.AddPayslips({
            renderTo: addPayslipsModal.getContainer(),
            show: true,
            
            payrunId: payrunId,
            deletedPayslips: deletedPayslips,
            addedPayslipIds: addedPayslipIds,
            
            onAdd: function( event ) {
                // For every payslip
                for( let i = 0; i < payslips.length; i++ ) {
                    // Get the payslip data object
                    let payslip = payslips[i].toObject();
                    
                    // Is the payslip already added?
                    if( payslip.id == event.payslip.id ) {
                        // Is the payslip currently marked as deleted?
                        if( payslip.statusCode === 'DELE' ) {
                            // Restore the payslip
                            payslips[i].restorePayslip();
                            
                            payslipsChanged = true;
                            confirmDestroy = true;
                        }
                        return;
                    }
                }
                
                // Add the new payslip
                var newPayslip = new app.panel.EditPayslip({
                    renderTo: payslipSectionEl,
                    width: '100%',
                    maxWidth: '900px',
                    margin: '15px 0px 0px 0px',
                    payslip: event.payslip,
                    
                    onChange: payslipEditorChangeEventHandler,
                    onItemAdd: payslipEditorChangeEventHandler,
                    onDelete: payslipEditorDeleteEventHandler,
                    onRecreate: payslipEditorRecreateEventHandler
                });
                
                payslips.push( newPayslip );
                addedPayslipIds.push( event.payslip.id );
                
                payslipsChanged = true;
                confirmDestroy = true;
            },
            onFinish: function() {
                // loadPayrun();
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addPayslipsModal.addEventListener('destroy', function() {
            addPayslipsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addPayslipsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addPayslipsModal.show();
        addPayslipsPanel.focus();
    }
    
    // menuDropDownBtnEmailPayslipsEl click event handler
    function menuDropDownBtnEmailPayslipsElClickEventHandler() {
        // Has the payrun not been processed?
        if( !isProcessed ) {
            new lx.component.Messagebox({
                title: 'Email Payslips',
                message: 'The payslips cannot be emailed because the specified payrun has not been processed.'
            });
            return;
        }
        
        // Create a modal window
        var emailPayslipsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '800px',
            maxHeight: '100%'
        });
        
        // Create the emailPayslipsPanel panel
        var emailPayslipsPanel = new app.panel.EmailPayslips({
            renderTo: emailPayslipsModal.getContainer(),
            show: true,
            
            payrunId: parseInt(payrunId),
            
            onEmail: function() {
                app.route.popState();
                new lx.component.Messagebox({
                    title: 'Email Payslips',
                    message: 'The selected payslips were successfully sent.'
                });
        },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        emailPayslipsModal.addEventListener('destroy', function() {
            emailPayslipsPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: emailPayslipsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        emailPayslipsModal.show();
        emailPayslipsPanel.focus();
    }
    
    
    // menuDropEditDescriptionElClickEventHandler click event handler
    function menuDropEditDescriptionElClickEventHandler() {
        // Create a modal window
        var addDepartmentModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '232px'
        });
        
        // Create the addDepartmentPanel panel
        var addDepartmentPanel = new app.panel.EditPayrunDescription({
            renderTo: addDepartmentModal.getContainer(),
            show: true,
            payrunId: config.payrunId,
            payrunDescription: config.payrunDescription,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadPayrunDescription();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addDepartmentModal.addEventListener('destroy', function() {
            addDepartmentPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addDepartmentModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addDepartmentModal.show();
        addDepartmentPanel.focus();
    }
    
    // menuDropDownBtnDownloadReportEl click event handler
    function menuDropDownBtnDownloadReportElClickEventHandler() {
        // Create a modal window
        let runReportModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '235px'
        });
        
        // Create the runReportPanel panel
        let runReportPanel = new app.panel.RunPayrunReport({
            renderTo: runReportModal.getContainer(),
            show: true,
            
            payrunId: parseInt(payrunId),
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        runReportModal.addEventListener('destroy', function() {
            runReportPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: runReportModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        runReportModal.show();
        runReportPanel.focus();
    }
    
    // menuDropDownBtnPostLexproEl click event handler
    function menuDropDownBtnPostLexproElClickEventHandler() {
        // Has the payrun not been processed?
        if( !isProcessed ) {
            new lx.component.Messagebox({
                title: 'Post Lexpro Transactions',
                message: 'The payrun transactions cannot be exported because the payrun has not been processed.'
            });
            return;
        }
        
        // Check the Lexpro Accounting connection
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=checkConnection',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Checking Lexpro Accounting Connection',
                        message: response.error
                    });
                }
                
                // Make certain we are connected to Lexpro Accounting and that the configuration is complete
                if( response.connected != true ) {
                    new lx.component.Messagebox({
                        title: 'Post To Lexpro Accounting',
                        message: 'You are not connected to Lexpro Accounting. Please connect to Lexpro Accounting in the \'Accounting Setup\' tab of the \'Setup\' section.'
                    });
                    return;
                }
                else if( response.configComplete != true ) {
                    new lx.component.Messagebox({
                        title: 'Post To Lexpro Accounting',
                        message: 'Your Lexpro Accounting configuration is incomplete. Please configure your Lexpro Accounting settings in the \'Accounting Setup\' tab of the \'Setup\' section.'
                    });
                    return;
                }
                
                // Create a modal window
                var postToLexproModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '1200px',
                    maxHeight: '100%'
                });
                
                // Create the postToLexproPanel panel
                var postToLexproPanel = new app.panel.PostToLexpro({
                    renderTo: postToLexproModal.getContainer(),
                    show: true,
                    
                    payrunId: parseInt(payrunId),
                    payrunDescription: payrunDescription,
                    
                    onPost: function() {
                        me.updatePayrunGrid = true;
                        app.route.popState();
                        new lx.component.Messagebox({
                            title: 'Post To Lexpro Accounting',
                            message: 'The transactions were successfully posted to Lexpro Accounting.'
                        });
                    },
                    onCancel: function() {
                        app.route.popState();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                postToLexproModal.addEventListener('destroy', function() {
                    postToLexproPanel.destroy();
                });
                
                // Create a route entry for the panel
                let state = {
                    modal: postToLexproModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                postToLexproModal.show();
                postToLexproPanel.focus();
            }
        });
    }

    // menuDropDownBtnPayeOverDeductionCreditEl click event handler
    function menuDropDownBtnPayeOverDeductionCreditElClickEventHandler() {
        new lx.component.Messagebox({
            message: 
                'Any changes to the payrun will be saved if you choose to continue with crediting over-deductions. Are you certain you wish to continue?',
            buttons: [
                {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                {name: 'credit', label: 'Continue', isDefault: true}
            ],
            onClose: function( closeEvent ) {
                // Should the payrun be processed?
                if( closeEvent.button === 'credit' ) {
                    // Get all the payslip objects
                    var payslipObjects = [];
                    for (let i = 0; i < payslips.length; i++) {
                        payslipObjects.push( payslips[i].toObject() );
                    }
                    
                    // Set payrun data to be updated
                    var payrun = {
                        id: payrunId,
                        payslips: payslipObjects
                    };
                    
                    saveBtn.disable();
                    
                    // Update the selected payrun
                    lx.sendJSON({
                        url: 'exec.php?c=Payrun&fn=update',
                        data: {
                            payrun: payrun
                        },
                        onSuccess: function( responseText ) {
                            processBtn.hideLoader();
                            refreshBtnEl.enable();
                            processBtn.enable();
                            saveBtn.enable();
                            var response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Saving Payrun Failed',
                                    message: response.error
                                });
                                
                                return;
                            }
                            
                            // Re-load the payrun
                            loadPayrun();
                            
                            let allPayslips = [];
                            for( let i = 0; i < payslips.length; i++ ) {
                                let payslip = payslips[i].toObject();
                                allPayslips.push(payslip);
                            }

                            // Create a modal window
                            var payslipsPayeOverDeductionsCreditModal = new lx.component.ModalWindow({
                                margin: '40px',
                                maxWidth: '1280px',
                                maxHeight: '100%'
                            });
                            
                            // Create the PayslipsPayeOverDeductionsCreditPanel panel
                            var PayslipsPayeOverDeductionsCreditPanel = new app.panel.PayslipsPayeOverDeductionsCredit({
                                renderTo: payslipsPayeOverDeductionsCreditModal.getContainer(),
                                show: true,
                                
                                payrunId: parseInt(payrunId),
                                payslips: allPayslips,
                                onUpdate: function(event) {
                                    // app.route.popState();
                                    // Iterate through all items in event.items
                                    for( let i = 0; i < event.items.length; i++ ) {
                           
                                        // Get the current item
                                        let item = event.items[i];
                                        
                                        // Check if the item description is 'PAYE Correction'
                                        if (item.description === 'PAYE Correction') {

                                            // Iterate through the payslips array to find a matching payslip
                                            for( let i = 0; i < payslips.length; i++ ) {
                                                let payslip = payslips[i].toObject();

                                                // Check if the payslip ID matches the item's payslip ID
                                                if (payslip.id === item.payslipId) {
   
                                                payslips[i].addItems([item], false);

                                                payslipsChanged = true;
                                                confirmDestroy = true;
                                                
                                                }
                                            }
                                        }
                                        //return;
                                    }
                                },
                                onCancel: function() {
                                    app.route.popState();
                                }
                                
                            });
                            
                            // Add destroy event listener to modal to destroy the contained panel.
                            payslipsPayeOverDeductionsCreditModal.addEventListener('destroy', function() {
                                PayslipsPayeOverDeductionsCreditPanel.destroy();
                            });
                            
                            // Create a route entry for the panel
                            let state = {
                                modal: payslipsPayeOverDeductionsCreditModal
                            };
                            app.route.pushState(state, function( state ) {
                                state.modal.destroy();
                            });
                            
                            // Show the modal window and focus on the panel
                            payslipsPayeOverDeductionsCreditModal.show();
                            PayslipsPayeOverDeductionsCreditPanel.focus();
                        }
                    });
                }
                else {
                    return;
                }
            }
        });
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};