/* globals app, lx */
'use strict';


// VIEW RETIREMENT FUND SETUP PANEL
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
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewRetirementFundSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var addRetirementBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load retirement funds
    function loadRetirementFunds() {
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=getList',
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load retirement funds.'
                    });
                    
                    return;
                }
                
                // Add retirement funds sections
                for( let i = 0; i < result.providentFunds.length; i++ ) {
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            margin: '20px 0px 0px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF'
                        }
                    });
                    
                    // Create the type's heading bar
                    let typeHeadingEl = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            padding: '0px 3px 0px 15px',
                            height: '45px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 1px 0px',
                            borderColor: '#DFDFDF'
                        },
                        innerHTML: result.providentFunds[i].providentFundName
                    });
                    
                    // Create the menu dropdown button
                    let typeDropDownBtn = new lx.component.DropdownButton({
                        renderTo: typeHeadingEl,
                        margin: '0px 0px 0px 5px',
                        label: '<i class="fa fa-ellipsis-v"></i>',
                        dropdownAlignment: 'right'
                    });
                    
                    // Create the menuDropDownBtnAddEl element
                    let typeDropDownBtnEditEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                    });
                    typeDropDownBtnEditEl.addEventListener('click', typeDropDownBtnEditElClickEventHandler.bind(me, result.providentFunds[i].id));
                    
                    let typeDropDownBtnDeleteEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                    });
                    typeDropDownBtnDeleteEl.addEventListener('click', menuDropDownBtnDeleteElClickEventHandler.bind(me, result.providentFunds[i].id, result.providentFunds[i].providentFundName));
                    
                    var detailsContainer = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            padding: '10px 15px'
                            
                        }
                    });
                    
                    var fundType = 'Percentage';
                    var sign = '%';
                    if (result.providentFunds[i].providentFundCalculationTypeCode === 'FIXE') {
                        fundType = 'Amount';
                        sign = '';
                    }
                    
                    var employeeAmountDisplay = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Employee ' + fundType + ':',
                        labelWidth: '230px',
                        margin: '0px 0px 0px 0px'
                    });
                    let employeeAmount = result.providentFunds[i].employeeAmount;
                    employeeAmount = (Math.round(employeeAmount * 100) / 100).toFixed(2);
                    employeeAmountDisplay.setValue( employeeAmount + sign);
                    
                    var employerAmountDisplay = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Employer ' + fundType + ':',
                        labelWidth: '230px',
                        margin: '10px 0px 0px 0px'
                    });
                    let employerAmount = result.providentFunds[i].employerAmount;
                    employerAmount = (Math.round(employerAmount * 100) / 100).toFixed(2);
                    employerAmountDisplay.setValue( employerAmount + sign);
                    
                    var enrolledEmployees = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Enrolled Employees:',
                        labelWidth: '230px',
                        margin: '10px 0px 0px 0px'
                    });
                    enrolledEmployees.setValue(result.providentFunds[i].enrolledEmployees);
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
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
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
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Retirement Fund'
        });
        
        // Create the addRetirementBtn component
        addRetirementBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px auto',
            
            onClick: addRetirementBtnClickEventHandler
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
        
        
        // Load retirement fund
        loadRetirementFunds();
        
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
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // typeDropDownBtnAddEl click event handler
    function addRetirementBtnClickEventHandler() {
        // Create a modal window
        var addRetirementFundModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '419px'
        });
        
        // Create the editAddressDetailsPanel panel
        var addRetirementPanel = new app.panel.AddRetirementFund({
            renderTo: addRetirementFundModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                contentContainerEl.innerHTML = '';
                loadRetirementFunds();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addRetirementFundModal.addEventListener('destroy', function() {
            addRetirementPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addRetirementFundModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addRetirementFundModal.show();
        addRetirementPanel.focus();
    }
    
    // typeDropDownBtnDeleteEl click event handler
    function menuDropDownBtnDeleteElClickEventHandler(providentFundId, providentFundName) {
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=checkRemove',
            data: {
                providentFundId: providentFundId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable To Remove Retirement Fund',
                        message: response.error
                    });
                    
                    return;
                }
                
                new lx.component.Messagebox({
                    title: 'Remove Retirement Fund',
                    message: 'Are you sure you want to remove the ' + providentFundName + ' fund?',
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'remove', label: 'Remove', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'remove' ) {
                            lx.sendJSON({
                                url: 'exec.php?c=ProvidentFund&fn=remove',
                                data: {
                                    providentFundId: providentFundId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Failed To Remove Retirement Fund',
                                            message: response.error
                                        });
                                        
                                        return;
                                    }
                                    
                                    contentContainerEl.innerHTML = '';
                                    loadRetirementFunds();
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    
    // typeDropDownBtnAddEl click event handler
    function typeDropDownBtnEditElClickEventHandler(providentFundId) {
        // Create a modal window
        var editRetirementFundModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '419px'
        });
        
        // Create the editAddressDetailsPanel panel
        var editRetirementFundPanel = new app.panel.EditRetirementFund({
            renderTo: editRetirementFundModal.getContainer(),
            show: true,
            providentFundId: providentFundId,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                contentContainerEl.innerHTML = '';
                loadRetirementFunds();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editRetirementFundModal.addEventListener('destroy', function() {
            editRetirementFundPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editRetirementFundModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editRetirementFundModal.show();
        editRetirementFundPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};