/* globals app, lx */
'use strict';


// ALLOCATE LEAVE PANEL
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
app.panel.AllocateLeave = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var importInfoSectionEl = null;
    
    var wizardSectionEl = null;
    var wizardHeadingContainerEl = null;
    var wizardHeadingEl = null;
    var wizardContentContainerEl = null;
    var wizardPageContainerEl = null;
    var wizardButtonContainerEl = null;
    var wizardCancelBtn = null;
    var wizardPreviousBtn = null;
    var wizardNextBtn = null;
    
    var wizardPage1ContainerEl = null;
    var leaveTypeSelect = null;
    var allocationTypeRadio = null;
    var descriptionTxt = null;
    var effectiveDate = null;
    var amountTxt = null;
    var unitEl = null;
    
    var wizardPage2ContainerEl = null;
    var employeesGrid = null;
    
    var pageNum = 1;
    
    var allocationTypes = [
        { value: 'ADJU', text: 'Adjustment' },
        { value: 'LEAR', text: 'Leave Earned' },
        { value: 'LTAK', text: 'Leave Taken' },
        { value: 'RESE', text: 'Reset' }
    ];
    
    var leaveTypes = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    // lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load leave types
    function loadLeaveTypes() {
        // Load the leave types from database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                // Check if the function was successful.
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    
                    return;
                }
                
                // Save the leave types
                leaveTypes = [];
                for( var i = 0; i < response.leaveTypes.length; i++ ) {
                    leaveTypes.push({
                        value: response.leaveTypes[i].id,
                        text: response.leaveTypes[i].name,
                        unitCode: response.leaveTypes[i].leaveUnitCode
                    });
                    
                }
                
                // Add the leave types to the select component
                leaveTypeSelect.addItems( leaveTypes );
            }
        });
    }
    
    // Function to start editing a grid cell
    //
    // rowIndex         The row index of the cell to edit.
    // colIndex         The column index of the cell to edit.
    // focus            Should the component be focussed after being created.
    function editGridCell(rowIndex, colIndex, focus) {
        let record = employeesGrid.getRow(rowIndex);
        let cell = employeesGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = employeesGrid.getColumnDataIndex(colIndex);
        let newComponent = null;
        let value = record[employeesGrid.getColumnDataIndex(colIndex)];
        
        cell.innerHTML = '';
        cell.style.overflow = 'visible';
        
        // Create the edit component depending on the dataIndex
        if( dataIndex === 'amount' ) {
            // Create a textbox component
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null,
                textAlign: 'right'
            });
            
            // Remove the unit part and format the value for editing
            value = value.slice(0, -2);
            value = lx.util.parseCurrency(value);
            if( isNaN(value) ) {
                value = '';
            }
        }
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Get the new value
            let newValue = newComponent.getValue();
            
            // Format the new value depending on the column being edited
            if( dataIndex === 'amount' ) {
                newValue = lx.util.parseCurrency(newValue);
                if( !isNaN(newValue) ) {
                    // Depending on the allocation type
                    if( allocationTypeRadio.getValue() === 'LEAR' ) {
                        if( newValue < 0.001 ) {
                            newValue = newValue * -1;
                        }
                    }
                    else if( allocationTypeRadio.getValue() === 'LTAK' ) {
                        if( newValue > -0.009 ) {
                            newValue = newValue * -1;
                        }
                    }
                    
                    // Update the color of the amount depending on whether it's positive or negative
                    if( (newValue < 0.001) && (newValue > -0.009) ) {
                        employeesGrid.getCellContainer(rowIndex, colIndex).style.color = lx.style.global.color;
                    }
                    else if( newValue > -0.009 ) {
                        employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#02BD79';
                    }
                    else {
                        employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#E74C3C';
                    }
                    
                    // Update the new leave balance
                    let currentBalance = record[employeesGrid.getColumnDataIndex(colIndex-1)].slice(0, -2);
                    currentBalance = lx.util.parseCurrency(currentBalance);
                    record[employeesGrid.getColumnDataIndex(colIndex+1)] = lx.util.formatCurrency(currentBalance + newValue) + (unitEl.innerHTML === 'days' ? ' d' : ' h');
                    
                    // Format the new value for display
                    newValue = lx.util.formatCurrency(newValue) + (unitEl.innerHTML === 'days' ? ' d' : ' h');
                }
                else {
                    // Update the new balance to be unchanged from the current balance
                    record[employeesGrid.getColumnDataIndex(colIndex+1)] = record[employeesGrid.getColumnDataIndex(colIndex-1)];
                    newValue = '';
                }
            }
            
            // Update the row and destroy the component before moving to the next
            record[employeesGrid.getColumnDataIndex(colIndex)] = newValue;
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            employeesGrid.updateRow(rowIndex, record);
            updateGridAmountColor(rowIndex);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            // Get the new value
            let newValue =  newComponent.getValue();
            
            // Format the new value depending on the column being edited
            if( dataIndex === 'amount' ) {
                newValue = lx.util.parseCurrency(newValue);
                if( !isNaN(newValue) ) {
                    // Depending on the allocation type
                    if( allocationTypeRadio.getValue() === 'LEAR' ) {
                        if( newValue < 0.001 ) {
                            newValue = newValue * -1;
                        }
                    }
                    else if( allocationTypeRadio.getValue() === 'LTAK' ) {
                        if( newValue > -0.009 ) {
                            newValue = newValue * -1;
                        }
                    }
                    
                    // // Update the color of the amount depending on whether it's positive or negative
                    // if( (newValue < 0.001) && (newValue > -0.009) ) {
                    //     employeesGrid.getCellContainer(rowIndex, colIndex).style.color = lx.style.global.color;
                    // }
                    // else if( newValue > -0.009 ) {
                    //     employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#02BD79';
                    // }
                    // else {
                    //     employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#E74C3C';
                    // }
                    
                    // Update the new leave balance
                    let currentBalance = record[employeesGrid.getColumnDataIndex(colIndex-1)].slice(0, -2);
                    currentBalance = lx.util.parseCurrency(currentBalance);
                    record[employeesGrid.getColumnDataIndex(colIndex+1)] = lx.util.formatCurrency(currentBalance + newValue) + (unitEl.innerHTML === 'days' ? ' d' : ' h');
                    
                    // Format the new value for display
                    newValue = lx.util.formatCurrency(newValue) + (unitEl.innerHTML === 'days' ? ' d' : ' h');
                }
                else {
                    // Update the new balance to be unchanged from the current balance
                    record[employeesGrid.getColumnDataIndex(colIndex+1)] = record[employeesGrid.getColumnDataIndex(colIndex-1)];
                    newValue = '';
                }
            }
            
            // Was the enter key pressed?
            if( event.key === 13 ) {
                // Update the row and destroy the component before moving to the next
                record[employeesGrid.getColumnDataIndex(colIndex)] = newValue;
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                employeesGrid.updateRow(rowIndex, record);
                updateGridAmountColor(rowIndex);
            }
            // Was the tab key pressed?
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[employeesGrid.getColumnDataIndex(colIndex)] = newValue;
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                employeesGrid.updateRow(rowIndex, record);
                updateGridAmountColor(rowIndex);
                
                // Edit the next cell
                if( dataIndex === 'amount' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < employeesGrid.getRowCount() ) {
                        // Edit the next row
                        editGridCell(rowIndex + 1, colIndex, false);
                    }
                }
            }
        });
        
        // Focus on the new component
        if( focus === true ) newComponent.focus();
        
        // Set the value of the 
        newComponent.setValue( value );
        newComponent.select();
    }
    
    // Function to set the text color of the grid amount depedning on the value it contains
    //
    // rowIndex         The row index of the cell to edit.
    function updateGridAmountColor(rowIndex) {
        // Don't continue if row index is out of bounds
        if( rowIndex >= employeesGrid.getRowCount() ) {
            return;
        }
        
        let colIndex = 4;
        let record = employeesGrid.getRow(rowIndex);
        let value = record[employeesGrid.getColumnDataIndex(colIndex)];
        
        // Remove the unit part and format the value
        value = value.slice(0, -2);
        value = lx.util.parseCurrency(value);
        if( isNaN(value) ) {
            value = '0.00';
        }
        value = lx.util.parseCurrency(value);
        
        // Update the color of the amount depending on whether it's positive or negative
        if( (value < 0.001) && (value > -0.009) ) {
            employeesGrid.getCellContainer(rowIndex, colIndex).style.color = lx.style.global.color;
            employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = lx.style.global.color;
        }
        else if( value > -0.009 ) {
            employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#58B983' // '#02BD79';
            employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = '#58B983' // '#02BD79';
        }
        else {
            employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#E74C3C';
            employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = '#E74C3C';
        }
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            certificateFileId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onFinish') ) me.addEventListener('finish', compConfig.onFinish);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            // parent: me.getContainer(),
            parent: compConfig.renderTo,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                backgroundColor: '#F4F5F6',
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
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                color: lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 20px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-user-clock" style="margin: 0px 15px 0px 0px;"></i>Allocate Leave'
        });
        
        
        // Create importInfoSectionEl
        importInfoSectionEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px auto',
                padding: '0px 20px',
                height: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
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
                padding: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor
            }
        });
        
        
        //
        // WIZARD SECTION
        //
        
        // Create the wizardSectionEl
        wizardSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                overflow: 'auto'
            }
        });
        
        
        // Create the wizardHeadingContainerEl
        wizardHeadingContainerEl = lx.createElement('DIV', {
            parent: wizardSectionEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 15px 0px 15px',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the wizardHeadingEl
        wizardHeadingEl = lx.createElement('DIV', {
            parent: wizardHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: 'auto 0px',
                padding: '10px 0px',
                fontSize: '16px'
            },
            innerHTML: 
                'Leave Details (1/2)'
        });
        
        new lx.createElement('DIV', {
            parent: wizardHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                textAlign: 'right',
                fontSize: '12px',
                margin: 'auto 0px'
            },
            innerHTML: 
                'Items marked with * are required'
        });
        
        // Create the wizardContentContainerEl
        wizardContentContainerEl = lx.createElement('DIV', {
            parent: wizardSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: lx.style.global.color,
                backgroundColor: '#F5F6F7', // lx.style.global.backgroundColor,
                overflow: 'auto',
            }
        });
        
        // Create the wizardPageContainerEl
        wizardPageContainerEl = lx.createElement('DIV', {
            parent: wizardContentContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                maxWidth: '980px'
            }
        });
        
        
        //
        // WIZARD PAGE 1
        //
        
        wizardPage1ContainerEl = lx.createElement('DIV', {
            parent: wizardPageContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'left',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
                overflow: 'auto'
            }
        });
        
        // // Display a message to the user
        // let noteSectionEl = lx.createElement('DIV', {
        //     parent: wizardPage1ContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         backgroundColor: '#FFFFFF',
        //         borderStyle: 'solid',
        //         borderColor: '#DFDFDF',
        //         borderWidth: '1px',
        //         margin: '15px 0px',
        //         padding: '15px 30px',
        //         width: '100%',
        //         // maxWidth: '900px',
        //         // borderRadius: '15px'
        //     }
        // });
        
        // new lx.createElement('DIV', {
        //     parent: noteSectionEl,
        //     style: {
        //         margin: 'auto 15px auto 0px',
        //         textAlign: 'center',
        //         fontSize: '32px'
        //     },
        //     innerHTML: '<i class="fas fa-exclamation-triangle" style="margin: auto 10px auto 0px; color: ' + lx.style.global.highlightColor + ';"></i>'
        // });
        
        // new lx.createElement('DIV', {
        //     parent: noteSectionEl,
        //     style: {
        //         margin: 'auto 0px',
        //         // maxWidth: '700px',
        //         textAlign: 'justify',
        //         fontSize: '14px'
        //     },
        //     innerHTML: 
        //         'Please note that leave is calculated automatically for each employee based on the leave type(s) to which the ' + 
        //         'employee is subscribed. The use of this function to allocate leave manually should be reserved primarily to ' + 
        //         'setup leave for the first time or to make corrections, if required.'
        // });
        
        let page1NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#828282', // '#3B81EB',
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px',
                margin: '15px 0px',
                padding: '15px 30px',
                width: '100%',
                // maxWidth: '900px',
                borderRadius: '15px'
            }
        });
        
        new lx.createElement('DIV', {
            parent: page1NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '25px'
            },
            innerHTML: 
                '<i class="fas fa-exclamation-triangle" style=" ' + 
                    'margin: auto 10px auto 0px; ' + 
                    // 'color: ' + lx.style.global.highlightColor + ';' +
                    // 'background-color: ' + lx.style.global.backgroundColor + ';' +
                    // 'padding: 8px; ' +
                    // 'border-radius: 50%; ' +
                '"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page1NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'Please note that leave is calculated automatically for each employee based on the leave type(s) to which the ' + 
                'employee is subscribed. The use of this function to allocate leave manually should be reserved primarily to ' + 
                'setup leave for the first time or to make corrections, if required.'
        });
        
        // Create leaveTypeSelect component
        leaveTypeSelect = new lx.component.Selectbox({
            renderTo: wizardPage1ContainerEl,
            label: 'Leave Type *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '780px',
            margin: '15px 0px 0px 0px',
            
            onChange: leaveTypeSelectOnChangeEventHandler
        });
        
        // Create a container for the component as well as the info icon
        let actionContainerEl = new lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '15px 0px 0px 0px'
            }
        });
        
        // Create allocationTypeRadio component
        allocationTypeRadio = new lx.component.RadioGroup({
            renderTo: actionContainerEl,
            label: 'Allocation Type *',
            labelAlign: 'left',
            labelWidth: '220px',
            minWidth: '780px',
            maxWidth: '780px',
            margin: '0px 0px 0px 0px',
            
            items: allocationTypes,
            
            onChange: allocationTypeRadioOnChangeEventHandler
        });
        allocationTypeRadio.setValue( 'ADJU', 'Adjustment' );
        
        // Create an info icon
        let actionInfoEl = new lx.createElement('DIV', {
            parent: actionContainerEl,
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
        
        // Create the element used to position the tooltip
        let actionTooltipLocusEl = lx.createElement('DIV', {
            parent: actionContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px auto 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let actionInfoTooltip = new lx.component.Tooltip({
            renderTo: actionTooltipLocusEl,
            alignment: 'bottomRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '555px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'The type of leave allocation to make:<br><br>' +
                    '<div style="display: flex; flex-direction: row; margin: 0px 0px 15px 0px;">' +
                        '<div style="min-width: 100px; margin: auto 0px auto 0px; font-weight: bold;">Adjustment</div>' + 
                        '<div>Modify the leave balance of each employee by the specified amount. Positive and negative adjustments are permissible</div>' +
                    '</div>' +
                    '<div style="display: flex; flex-direction: row; margin: 0px 0px 15px 0px;">' +
                        '<div style="min-width: 100px; margin: auto 0px auto 0px; font-weight: bold;">Leave Earned</div>' + 
                        '<div>The amount will be designated as leave earned. Only positive amounts are permissible</div>' +
                    '</div>' +
                    '<div style="display: flex; flex-direction: row; margin: 0px 0px 15px 0px;">' +
                        '<div style="min-width: 100px; margin: auto 0px auto 0px; font-weight: bold;">Leave Taken</div>' + 
                        '<div>The amount will be designated as leave taken. Only positive amounts are permissible</div>' +
                    '</div>' +
                    '<div style="display: flex; flex-direction: row; margin: 0px 0px 0px 0px;">' +
                        '<div style="min-width: 100px; margin: auto 0px auto 0px; font-weight: bold;">Reset</div>' + 
                        '<div>Make automatic adjustments with the effect that the leave balance for each employee will be reset to zero</div>' +
                    '</div>' +
                '</span>'
        });
        actionInfoEl.addEventListener('mouseenter', function() { actionInfoTooltip.show(); });
        actionInfoEl.addEventListener('mouseleave', function() { actionInfoTooltip.hide(); });
        
        // Create the effectiveDate component
        effectiveDate = new lx.component.DatePicker({
            renderTo: wizardPage1ContainerEl,
            label: 'Effective Date *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '15px 0px 0px 0px'
        });
        effectiveDate.setValue(new Date().toISOString().slice(0, 10));
        
        // Create the descriptionTxt component
        descriptionTxt = new lx.component.Textbox({
            renderTo: wizardPage1ContainerEl,
            label: 'Description *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '15px 0px 0px 0px'
        });
        descriptionTxt.setValue('Adjustment');
        
        // Create a container for the component as well as the info icon
        let amountContainerEl = new lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '15px 0px 0px 0px'
            }
        });
        
        // Create the amountTxt component
        amountTxt = new lx.component.Textbox({
            renderTo: amountContainerEl,
            label: 'Amount *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '0px 0px 0px 0px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(lx.util.formatCurrency(value));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            }
        });
        
        // Create the unitEl component
        unitEl = new lx.createElement('DIV', {
            parent: amountContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: 'auto 0px auto 10px'
            },
            innerHTML: ''
        });
        
        
        //
        // WIZARD PAGE 2
        //
        
        wizardPage2ContainerEl = lx.createElement('DIV', {
            parent: wizardPageContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'left',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
                overflow: 'auto'
            }
        });
        
        employeesGrid = new lx.component.Grid({
            renderTo: wizardPage2ContainerEl,
            margin: '15px 0px 0px 0px',
            height: '100%',
            flex: '1 1 100%',
            autoSize: false,
            borderWidth: '1px',
            
            columns: [
                {dataIndex: 'select', width: '50px', type: 'rowSelect'},
                {dataIndex: 'employeeCode', name: 'Code', width: '80px'},
                {dataIndex: 'employeeAlias', name: 'Employee Name', minWidth: '100px'},
                {dataIndex: 'leaveBalance', name: 'Current Balance', width: '120px', alignment: 'right'},
                // {dataIndex: 'description', name: 'Description', width: '200px', alignment: 'left'},
                {dataIndex: 'amount', name: 'Amount' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '120px', alignment: 'right'},
                {dataIndex: 'result', name: 'New Balance', width: '120px', alignment: 'right'}
            ],
            
            onCellClick: employeesGridCellClickEventHandler,
            onRowSelect: null,
            onRowDeselect: null,
            onSelectAllRows: null,
            onDeselectAllRows: null
        });
        
        
        //
        // WIZARD BUTTON CONTAINER SECTION
        //
        
        // // Create a spacing element
        // lx.createElement('DIV', {
        //     parent: wizardPageContainerEl,
        //     style: {
        //         display: 'flex',
        //         flex: '1 1 100%',
        //         // maxHeight: '0px'
        //     }
        // });
        
        // Create the buttonContainerEl element
        wizardButtonContainerEl = lx.createElement('DIV', {
            parent: wizardSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '10px 15px',
                // margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: '#F5F6F7', // lx.style.global.backgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 1px 0px'
            }
        });
        
        // Create the wizardCancelBtn component
        wizardCancelBtn = new lx.component.Button({
            renderTo: wizardButtonContainerEl,
            label: '<i class="far fa-window-close" style="margin: 0px 10px 0px 0px;"></i>Close',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px 0px',
            // style: 'text',
            
            onClick: wizardCancelBtnClickEventHandler
        });
        
        // Create the wizardPreviousBtn component
        wizardPreviousBtn = new lx.component.Button({
            renderTo: wizardButtonContainerEl,
            label: '<i class="fa fa-chevron-circle-left" style="margin: 0px 10px 0px 0px;"></i>Previous',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 15px 0px auto',
            
            onClick: wizardPreviousBtnClickEventHandler
        });
        wizardPreviousBtn.disable();
        
        // Create the wizardNextBtn component
        wizardNextBtn = new lx.component.Button({
            renderTo: wizardButtonContainerEl,
            label: 'Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px 0px',
            
            onClick: wizardNextBtnClickEventHandler
        });
        
        // Load panel data
        loadLeaveTypes();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
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
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        // me.panelDestroy();
        return true;
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        leaveTypeSelect.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // allocationTypeRadio chenage event handler
    function allocationTypeRadioOnChangeEventHandler() {
        // Enable / disable the amount based on the selected action
        if( allocationTypeRadio.getValue() == 'RESE' ) {
            amountTxt.setValue('');
            amountTxt.disable();
        }
        else {
            amountTxt.enable();
        }
        
        // Set the description based on the selected action
        for( let i = 0; i < allocationTypes.length; i++ ) {
            if( allocationTypeRadio.getValue() == allocationTypes[i].value ) {
                descriptionTxt.setValue(allocationTypes[i].text);
                break;
            }
        }
        
    }
    
    // leaveTypeSelect chenage event handler
    function leaveTypeSelectOnChangeEventHandler() {
        // Find the specified leave type
        for( let i = 0; i < leaveTypes.length; i++ ) {
            // Was the leave type found?
            if( leaveTypes[i].value === leaveTypeSelect.getValue() ) {
                // Display the correct unit depending on the unit type
                if( leaveTypes[i].unitCode === 'DAYS' ) {
                    unitEl.innerHTML = 'days';
                }
                else {
                    unitEl.innerHTML = 'hours';
                }
                break;
            }
        }
    }
    
    // employeesGrid cell click event handler
    function employeesGridCellClickEventHandler(clickEvent) {
        // Get the data index of the column that was clicked
        let dataIndex = employeesGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( (dataIndex === 'amount') && (allocationTypeRadio.getValue() != 'RESE') ) {
            editGridCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }
    }

    // wizardCancelBtn click event handler
    function wizardCancelBtnClickEventHandler() {
        // Fire the cancel event
        // console.log("cancel event has been triggered")
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // wizardPreviousBtn click event handler
    function wizardPreviousBtnClickEventHandler() {
        wizardSectionEl.scrollTop = 0;
        
        // Depending on the page we're on
        if( pageNum === 1 ) {
            // Can't go back
        }
        else if( pageNum === 2 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Leave Details (' + pageNum + '/2)';
            
            // Display the previous page
            wizardPage1ContainerEl.style.display = 'flex';
            wizardPage2ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Disable the previous button
            wizardPreviousBtn.disable();
        }
    }
    
    // wizardNextBtn click event handler
    function wizardNextBtnClickEventHandler() {
        wizardSectionEl.scrollTop = 0;
        
        // Depending on the page we're on
        if( pageNum === 1 ) {
            // Do sanity cehecks
            if( leaveTypeSelect.getValue() === null ) {
                wizardNextBtn.showWarning(
                    'No leave type specified. Please select a leave type.'
                );
                return;
            }
            else if( (effectiveDate.getValue() === null) || (effectiveDate.getValue().trim() == '') ) {
                wizardNextBtn.showWarning(
                    'No effective date specified. Please enter the effective date.'
                );
                return;
            }
            else if( (descriptionTxt.getValue() === null) || (descriptionTxt.getValue().trim() == '') ) {
                wizardNextBtn.showWarning(
                    'No description specified. Please enter the description.'
                );
                return;
            }
            else if( (amountTxt.getValue() === null) || (amountTxt.getValue().trim() == '') ) {
                if( allocationTypeRadio.getValue() !== 'RESE' ) {
                    wizardNextBtn.showWarning(
                        'No amount specified. Please enter the amount.'
                    );
                    return;
                }
            }
            
            // Is the leave not being reset?
            let allocationAmount = 0;
            if( allocationTypeRadio.getValue() !== 'RESE' ) {
                // Get the amount entered
                allocationAmount = parseFloat(lx.util.parseCurrency( amountTxt.getValue() ));
                
                // Is the leave less than zero and not being adjusted?
                if( (allocationTypeRadio.getValue() !== 'ADJU') && (allocationAmount < 0.001) ) {
                    wizardNextBtn.showWarning(
                        'Invalid amount. Negative amounts are not permissible for this allocation type.'
                    );
                    return;
                }
                
                // Convert the amount to a negative amount if leave is taken
                if( allocationTypeRadio.getValue() == 'LTAK' ) {
                    allocationAmount = 0 - parseFloat(allocationAmount);
                }
            }
            
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            
            // Load employee leave balances
            lx.sendJSON({
                url: 'exec.php?c=Employee&fn=getLeaveBalanceList',
                data: {
                    leaveTypeId: leaveTypeSelect.getValue(),
                    balanceDate: effectiveDate.getValue() // null
                },
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    
                    // Check if the function was successful.
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to load employee leave balances',
                            message: response.error
                        });
                        return;
                    }
                    
                    // Was no employees found?
                    if( response.employees.length <= 0 ) {
                        wizardNextBtn.showWarning(
                            'No employees are currently subscribed to the specified leave type.'
                        );
                        return;
                    }
                    
                    // Populate grid
                    var employees = [];
                    for( var i = 0; i < response.employees.length; i++ ) {
                        // Determine the leave unit
                        let leaveUnit = ' d';
                        if( response.employees[i].leaveTypeUnitCode != 'DAYS' ) {
                            leaveUnit = ' h';
                        }
                        
                        // Is the leave being reset?
                        if( allocationTypeRadio.getValue() === 'RESE' ) {
                            // Set the allocation amount
                            allocationAmount = 0 - response.employees[i].leaveBalance;
                        }
                        
                        // Add the employee details
                        employees.push({
                            select: false,
                            employeeId: response.employees[i].employeeId,
                            employeeCode: response.employees[i].employeeCode,
                            employeeAlias: response.employees[i].employeeAlias,
                            leaveBalance: lx.util.formatCurrency(response.employees[i].leaveBalance) + leaveUnit,
                            description: descriptionTxt.getValue(),
                            amount: lx.util.formatCurrency(allocationAmount) + leaveUnit,
                            result: lx.util.formatCurrency(parseFloat(response.employees[i].leaveBalance) + parseFloat(allocationAmount)) + leaveUnit,
                            spacer: ''
                        });
                    }
                    
                    // Clear the grid and add the new rows
                    employeesGrid.clear();
                    employeesGrid.addRows( employees );
                    
                    // Update the amount color
                    for( let rowIndex = 0; rowIndex < employeesGrid.getRowCount(); rowIndex++ ) {
                        updateGridAmountColor(rowIndex);
                    }
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Select Employees (' + pageNum + '/2)';
                    
                    // Display the next page
                    wizardPage1ContainerEl.style.display = 'none';
                    wizardPage2ContainerEl.style.display = 'flex';
                    
                    // Enable the previous button
                    wizardPreviousBtn.enable();
                    
                    // Change the label of the next button
                    wizardNextBtn.setLabel('Finish');
                }
            });
        }
        else if( pageNum === 2 ) {
            // Have no employees been selected?
            if( employeesGrid.getSelectedRowCount() <= 0 ) {
                wizardNextBtn.showWarning(
                    'No employees were selected. Please select one or more employees by clicking on the check mark next to the employee code or the highlighted icon at the top of the column to select all employees.'
                );
                return;
            }
            
            // Get allocation type name
            let allocationTypeName = '';
            if( allocationTypeRadio.getValue() === 'ADJU' ) {
                allocationTypeName = 'adjusted';
            }
            else if( allocationTypeRadio.getValue() === 'LEAR' ) {
                allocationTypeName = 'earned';
            }
            else if( allocationTypeRadio.getValue() === 'LTAK' ) {
                allocationTypeName = 'taken';
            }
            else {
                allocationTypeName = 'reset';
            }
            
            // Ask user permission to continue
            new lx.component.Messagebox({
                title: 'Allocate Leave',
                message: 
                    'Leave will be ' + allocationTypeName + ' for ' + employeesGrid.getSelectedRowCount() + ' selected employee(s). ' +
                    'Are you certain you wish to continue?',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'allocate', label: 'Allocate', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the leave be allocated?
                    if( closeEvent.button === 'allocate' ) {
                        // Disable the wizard buttons and show the loader
                        wizardNextBtn.showLoader();
                        wizardNextBtn.disable();
                        wizardPreviousBtn.disable();
                        
                        // Get all the allocations
                        let allocations = [];
                        
                        // For every selected employee
                        for( let rowIndex = 0; rowIndex < employeesGrid.getRowCount(); rowIndex++ ) {
                            // Skip unselected employees
                            if( !employeesGrid.rowIsSelected( rowIndex ) ) continue;
                            
                            // Get the row details
                            let record = employeesGrid.getRow( rowIndex );
                            
                            // Save the allocation details
                            allocations.push({
                                employeeId: record.employeeId,
                                leaveTypeId: leaveTypeSelect.getValue(),
                                action: allocationTypeRadio.getValue(),
                                description: descriptionTxt.getValue().trim(),
                                date: effectiveDate.getValue(),
                                amount: parseFloat(lx.util.parseCurrency(record.amount.slice(0, -2)))
                            });
                        }
                        
                        // Allocate leave
                        lx.sendJSON({
                            url: 'exec.php?c=Employee&fn=bulkAllocateLeave',
                            data: {
                                allocations: allocations
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse(responseText);
                                wizardNextBtn.hideLoader();
                                wizardNextBtn.enable();
                                wizardPreviousBtn.enable();
                                
                                // Check if the function was successful.
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Unable to allocate leave',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                // Fire the finish event
                                me.fireEvent('finish', {srcPanel: me});
                            }
                        });
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