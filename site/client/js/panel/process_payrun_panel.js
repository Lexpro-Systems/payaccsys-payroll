/* jslint node: true */
/* globals app, lx */
'use strict';


// PROCESS PAYRUN PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//
// Events:
//
//  onFinish            This event is fired after the profile data was successfully saved
//  onDestroy           This event is fired just before the component is destroyed
//
app.panel.ProcessPayrun = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleEl = null;
    var contentEl = null;
    var loader = null;
    
    var optionDetailsSectionEl = null;
    var emailPayslipsCb = null;
    
    var exceptionsMessageEl = null;
    var exceptionDetailsSectionEl = null;
    var execptionsGrid = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var processBtn = null;
    
    var payrunId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the required setup values
    function loadSetup() {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=get',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Setup Failed',
                        message: response.error
                    });
                    return;
                }
                
                emailPayslipsCb.setValue( response.setup.emailPayslipsOnPayrunProcess );
            }
        });
    }
    
    // Function to load the payrun exceptions
    function loadExceptions( payrunId ) {
        titleEl.innerHTML = 'Process Payrun: Checking for exceptions... Please wait.';
        loader.show(false);
        processBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getExceptions',
            data: {
                payrunId: payrunId
            },
            onSuccess: function( responseText ) {
                titleEl.innerHTML = 'Process Payrun';
                loader.hide();
                processBtn.enable();
                
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payrun Failed',
                        message: response.error
                    });
                }
                
                // Loop through all payrun
                let exceptions = [];
                for( let i = 0; i < response.exceptions.length; i++ ) {
                    exceptions.push({
                        description: ('<span style="color:#E72B2B">' + response.exceptions[i].description + '</span>'),
                        employeeName: response.exceptions[i].employee.name,
                        period: (response.exceptions[i].payslip.fromDate + ' to ' + response.exceptions[i].payslip.toDate)
                    });
                }
                execptionsGrid.addRows( exceptions );
                
                // Were no exceptions detected?
                if( response.exceptions.length < 1 ) {
                    exceptionsMessageEl.style.display = 'block';
                    exceptionDetailsSectionEl.style.display = 'none';
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
            
            payrunId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onProcess') ) me.addEventListener('process', compConfig.onProcess);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        
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
                flex: '0 0 auto',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Process Payrun'
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
                padding: '0px 0px 0px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // OPTIONS SECTION
        //
        
        // Create options heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Payrun Options',
            margin: '0px',
            width: ''
        });
        
        // Create options section
        optionDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the emailPayslipsCb component
        emailPayslipsCb = new lx.component.Checkbox({
            renderTo: optionDetailsSectionEl,
            label: 'Email Payslips',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        // emailPayslipsCb.setValue( true );
        
        
        //
        // EXCEPTIONS SECTION
        //
        
        // Create a container for the component as well as the info icon
        let exceptionReportHeadingContainerEl = new lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px',
                width: '100%'
            }
        });
        
        // Create details heading component
        new lx.component.Heading({
            renderTo: exceptionReportHeadingContainerEl,
            label: 'Exceptions',
            margin: '0px',
            padding: '20px 10px 10px 15px',
            width: ''
        });
        
        // Create the element used to position the tooltip
        let exceptionReportTooltipLocusEl = lx.createElement('DIV', {
            parent: exceptionReportHeadingContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 5px 0px',
                width: '0px',
                height: '1px'
            }
        });
        
        // Create an info icon
        let exceptionReportInfoEl = new lx.createElement('DIV', {
            parent: exceptionReportHeadingContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto auto 7px 0px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the tooltip component
        let exceptionReportTooltip = new lx.component.Tooltip({
            renderTo: exceptionReportTooltipLocusEl,
            alignment: 'bottomLeft',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: 'auto auto 5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'Please note that, if exceptions were found, you will not be able to continue until all exceptions are checked or resolved.<br><br>' +
                    'The exceptions can be checked either by clicking on the check-mark to the left of the exception or clicking on the highlighted check icon at the top of the list to check/uncheck all exceptions in the list.' +
                '</span>'
        });
        exceptionReportInfoEl.addEventListener('mouseenter', function() { exceptionReportTooltip.show(); });
        exceptionReportInfoEl.addEventListener('mouseleave', function() { exceptionReportTooltip.hide(); });
        
        // Create exceptions message element
        exceptionsMessageEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF',
                margin: '0px 15px 15px 15px',
                padding: '15px',
                display: 'none'
            }
        });
        exceptionsMessageEl.innerHTML = '<div style="font-size: 14px;">No exceptions found.</div>';
        
        // Create exceptions section
        exceptionDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 15px 15px'
            }
        });
        
        // Create execptionsGrid component
        execptionsGrid = new lx.component.Grid({
            renderTo: exceptionDetailsSectionEl,
            autoSize: true,
            // height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'select', width: '50px', type: 'rowSelect'},
                {dataIndex: 'period', name: 'Payslip Period', width: '180px'},
                {dataIndex: 'employeeName', name: 'Employee', width: '220px'},
                {dataIndex: 'description', name: 'Description'}
            ],
            
            onCellClick: execptionsGridCellClickEventHandler,
            onRowSelect: execptionsGridRowSelectEventHandler,
            onRowDeselect: execptionsGridRowSelectEventHandler,
            onSelectAllRows: execptionsGridRowSelectEventHandler,
            onDeselectAllRows: execptionsGridRowSelectEventHandler
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
            width: '120px',
            style: 'text',
            // margin: '0px 15px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        
        // Create the processBtn component
        processBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Process',
            width: '120px',
            
            onClick: processBtnClickEventHandler
        });
        
        // Load form data
        loadSetup();
        loadExceptions( compConfig.payrunId );
        
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
        // ...
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
    
    // execptionsGrid cell click event handler
    function execptionsGridCellClickEventHandler() {
    }
    
    // execptionsGrid row select event handler
    function execptionsGridRowSelectEventHandler() {
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Process button click event handler
    function processBtnClickEventHandler() {
        // Are there unchecket exceptions?
        if( execptionsGrid.getSelectedRowCount() !== execptionsGrid.getRowCount() ) {
            processBtn.showWarning('Exceptions have been found. Please click the checkmark next to each exception before processing the payrun.');
            return;
        }
        
        // Process the payrun
        processBtn.disable();
        processBtn.showLoader();
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=process',
            data: {
                payrunId: parseInt(payrunId),
                emailPayslips: emailPayslipsCb.getValue()
            },
            onSuccess: function( responseText ) {
                processBtn.hideLoader();
                processBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Processing Payrun Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Back to the list payrun panel
                confirmDestroy = false;
                me.fireEvent('process', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};