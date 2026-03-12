/* globals app, lx */
'use strict';

// ADD PAYRUN PANEL
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
//  onAdd              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddPayrun = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var payrunDetailsSectionEl = null;
    var departmentSelect = null;
    var descriptionTxt = null;
    var fromDate = null;
    var toDate = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var addBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load departments
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: departmentSelect.getSearchString(),
                limit: 10,
                offset: departmentSelect.getItemCount() - 1,
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                // Populate departments select box
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                    
                }
                departmentSelect.addItems( departments );
            }
        });
    }
    
    // Function to get avalible default dates
    function getDefaultDates() {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getDefaultDates',
            data: {
                payrunId: config.payrunId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                loader.hide();
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load dates',
                        message: response.error
                    });
                }
                
                if (response.fromDate !== null) {
                    fromDate.setValue(response.fromDate);
                    toDate.setValue(response.toDate);
                    // fromDate.fireEvent('change', {srcPanel: me});
                    // descriptionTxt.focus();
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
            height: '',
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
            innerHTML: 'Add Payrun'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
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
        // COMPANY DETAILS SECTION
        //
        
        // Create company details section
        payrunDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create department select
        departmentSelect = new lx.component.Selectbox({
            renderTo: payrunDetailsSectionEl,
            labelAlignment: 'top',
            label: 'Department',
            // height: '32px',
            // width: '200px',
            margin: '0px 0px 0px 0px',
            
            search: true,
            
            onSearch: function() {
                departmentSelect.clear();
                departmentSelect.addItems( [{ value: null, text: 'All Departments' }] );
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                loadDepartments();
            }
        });
        
        // Set department select data
        departmentSelect.addItems( [{ value: null, text: 'All Departments' }] );
        departmentSelect.setValue(null, 'All Departments');
        
        // Create the fromDate component
        fromDate = new lx.component.DatePicker({
            renderTo: payrunDetailsSectionEl,
            label: 'From Date',
            margin: '15px 0px 0px 0px',
            
            onBlur: dateChangeEventHandler
        });
        
        // Create the toDate component
        toDate = new lx.component.DatePicker({
            renderTo: payrunDetailsSectionEl,
            label: 'To Date',
            margin: '15px 0px 0px 0px',
            
            onBlur: dateChangeEventHandler
        });
        
        // Create the descriptionTxt component
        descriptionTxt = new lx.component.Textbox({
            renderTo: payrunDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Description'
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
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Add',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: addBtnClickEventHandler
        });
        
        loadDepartments();
        getDefaultDates();
        
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
        fromDate.focus();
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
    
    // Date control change event handler
    function dateChangeEventHandler() {
        // Have both dates been completed
        if( fromDate.getValue() !== '' && toDate.getValue() !== '' ) {
            // Was no description specified?
            if( descriptionTxt.getValue() === '' ) {
                // Set the description
                descriptionTxt.setValue(fromDate.getValue() + ' to ' + toDate.getValue());
            }
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Add button click event handler
    function addBtnClickEventHandler() {
        // Check that a from date was entered.
        if( fromDate.getValue() === '' ) {
            addBtn.showWarning('Please enter from date.');
            return;
        }
        
        // Check that the from date entered is valid
        if( fromDate.isValid() === false ) {
            addBtn.showWarning('Please enter a valid from date.');
            return;
        }
        
        // Check that a to date was entered
        if( toDate.getValue() === '' ) {
            addBtn.showWarning('Please enter a to date.');
            return;
        }
        
        // Check that the to date entered is valid
        if( toDate.isValid() === false ) {
            addBtn.showWarning('Please enter a valid to date.');
            return;
        }
        
        // Check that a description was entered.
        if( descriptionTxt.getValue() === '' ) {
            addBtn.showWarning('Please enter a description for the payrun.');
            return;
        }
        
        addBtn.showLoader();
        addBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=generate',
            data: {
                departmentId: departmentSelect.getValue(),
                startDate: fromDate.getValue(),
                endDate: toDate.getValue(),
                description: descriptionTxt.getValue()
            },
            onSuccess: function( responseText ) {
                
                addBtn.hideLoader();
                addBtn.enable();
                
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    addBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('add', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};