/* globals app, lx */
'use strict';


// ALLOCATE ATTENDANCE PANEL
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
app.panel.AllocateAttendance = function(config) {
    
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
    var signInTimeContainerEl = null;
    var signInDate = null;
    var signInTimeTxt = null;
    var signOutTimeContainerEl = null;
    var signOutDate = null;
    var signOutTimeTxt = null;
    var noteDetailsSectionEl = null;
    var temperatureTxt = null;
    var noteTxt = null;
    
    var wizardPage2ContainerEl = null;
    var employeesGrid = null;
    
    var pageNum = 1;
    
    var allocationTypes = [
        { value: 'ADJU', text: 'Adjustment' },
        { value: 'LEAR', text: 'Attendance Earned' },
        { value: 'LTAK', text: 'Attendance Taken' },
        { value: 'RESE', text: 'Reset' }
    ];
    
    var attendanceTypes = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    // lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Convert time in seconds to string format
    function secondsToTime( seconds ) {
        if( seconds <= 0 ) {
            return '-';
        }
        
        seconds = Number(seconds);
        let d = Math.floor(seconds / (3600*24));
        let h = Math.floor(seconds % (3600*24) / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        // let s = Math.floor(seconds % 60);
        
        var time = '';
        
        if( d > 0 ) {
            let value = ' days';
            if( d == 1 ) value = ' day';
            time = time + d + value;
        }
        
        if( h > 0 ) {
            let value = ' hours';
            if( h == 1 ) value = ' hour';
            if( time !== '' ) time = time + ', ';
            time = time + h + value;
        }
        
        if( m > 0 ) {
            let value = ' minutes';
            if( m == 1 ) value = ' minute';
            if( time !== '' ) time = time + ' and ';
            time = time + m + value;
        }
        
        // if( s > 0 ) {
        //     let value = ' seconds';
        //     if( s == 1 ) value = ' second';
        //     if( time !== '' ) time = time + ', ';
        //     time = time + s + value;
        // }
        
        if( time === '' ) {
            time = '0 minutes';
        }
        
        return time;
    }
    
    // Function to check if a date is valid
    // isoDateString            The date string to check in the format CCYY-MM-DD
    function isValidDate( isoDateString ) {
        // Check if the value was set to null or empty string
        if( isoDateString === '' ) return false;
        
        // Check if the new value is in correct format
        if( isoDateString.length !== 10 ) return false;
        
        // Check that the date is valid
        let year = parseInt(isoDateString.substr(0, 4));
        let month = parseInt(isoDateString.substr(5, 2));
        let day = parseInt(isoDateString.substr(8, 2));
         
        // Check that year is larger or equal to 0
        if( year < 0 ) return false;
        
        // Check that month is between 1 and 12
        if( month < 1 || month > 12 ) return false;
        
        // Make sure day is not less than 0 and not larger than 31;
        if( day < 1 || day > 31) return false;
        
        // Make sure day is correct for months with less than 31 days
        if( day > 28 ) {
            // If the month is 1, 3, 5, 7, 8, 10, 12 then the month has 31 days
            if( [4, 6, 9, 11].indexOf(month) > -1 ) {
                if( day > 30 ) return false;
            }
            else if( month === 2 ) {
                if( (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ) {
                    if( day > 29 ) return false;
                }
                else {
                    if( day > 28 ) return false;
                }
            }
        }
        
        return true;
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
        if( dataIndex === 'inDate' ) {
            // Create a textbox component
            newComponent = new lx.component.DatePicker({
                renderTo: cell,
                label: null,
                textAlign: 'left'
            });
        }
        else if( dataIndex === 'inTime' ) {
            // Create a textbox component
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null,
                textAlign: 'right'
            });
        }
        else if( dataIndex === 'outDate' ) {
            // Create a textbox component
            newComponent = new lx.component.DatePicker({
                renderTo: cell,
                label: null,
                textAlign: 'left'
            });
        }
        else if( dataIndex === 'outTime' ) {
            // Create a textbox component
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null,
                textAlign: 'right'
            });
        }
        else if( dataIndex === 'temperature' ) {
            // Create a textbox component
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null,
                textAlign: 'left'
            });
        }
        else if( dataIndex === 'note' ) {
            // Create a textbox component
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null,
                textAlign: 'left'
            });
        }
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Get the new value
            let newValue = newComponent.getValue();
            let totalTime = record.totalTime;
            
            // Format the new value depending on the column being edited
            if( dataIndex === 'inDate' ) {
                // Recalculate the time total
                let startDate = new Date(newValue.trim() + ' ' + record.inTime.trim() + ':01');
                let endDate = new Date(record.outDate.trim() + ' ' + record.outTime.trim() + ':01');
                let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                
                record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
            }
            else if( dataIndex === 'inTime' ) {
                // Recalculate the time total
                let startDate = new Date(record.inDate.trim() + ' ' + newValue.trim() + ':01');
                let endDate = new Date(record.outDate.trim() + ' ' + record.outTime.trim() + ':01');
                let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                
                record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
            }
            else if( dataIndex === 'outDate' ) {
                // Recalculate the time total
                let startDate = new Date(record.inDate.trim() + ' ' + record.inTime.trim() + ':01');
                let endDate = new Date(newValue.trim() + ' ' + record.outTime.trim() + ':01');
                let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                
                record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
            }
            else if( dataIndex === 'outTime' ) {
                // Recalculate the time total
                let startDate = new Date(record.inDate.trim() + ' ' + record.inTime.trim() + ':01');
                let endDate = new Date(record.outDate.trim() + ' ' + newValue.trim() + ':01');
                let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                
                record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
            }
            else if( dataIndex === 'temperature' ) {
                // Nothing to do here
            }
            else if( dataIndex === 'note' ) {
                // Nothing to do here
            }
            
            // Update the row and destroy the component before moving to the next
            record[employeesGrid.getColumnDataIndex(colIndex)] = newValue;
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            employeesGrid.updateRow(rowIndex, record);
            updateGridCellColor(rowIndex);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            // Get the new value
            let newValue =  newComponent.getValue();
            
            // Format the new value depending on the column being edited
            if( dataIndex === 'inDate' ) {
                // Recalculate the time total
                // ...
            }
            else if( dataIndex === 'inTime' ) {
                // Recalculate the time total
                // ...
            }
            else if( dataIndex === 'outDate' ) {
                // Recalculate the time total
                // ...
            }
            else if( dataIndex === 'outTime' ) {
                // Recalculate the time total
                // ...
            }
            else if( dataIndex === 'temperature' ) {
                // Nothing to do here
            }
            else if( dataIndex === 'note' ) {
                // Nothing to do here
            }
            
            // Was the enter or tab key pressed?
            if( (event.key === 9) || (event.key === 13) ) {
                // Format the new value depending on the column being edited
                if( dataIndex === 'inDate' ) {
                    // Recalculate the time total
                    let startDate = new Date(newValue.trim() + ' ' + record.inTime.trim() + ':01');
                    let endDate = new Date(record.outDate.trim() + ' ' + record.outTime.trim() + ':01');
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    
                    record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
                }
                else if( dataIndex === 'inTime' ) {
                    // Recalculate the time total
                    let startDate = new Date(record.inDate.trim() + ' ' + newValue.trim() + ':01');
                    let endDate = new Date(record.outDate.trim() + ' ' + record.outTime.trim() + ':01');
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    
                    record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
                }
                else if( dataIndex === 'outDate' ) {
                    // Recalculate the time total
                    let startDate = new Date(record.inDate.trim() + ' ' + record.inTime.trim() + ':01');
                    let endDate = new Date(newValue.trim() + ' ' + record.outTime.trim() + ':01');
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    
                    record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
                }
                else if( dataIndex === 'outTime' ) {
                    // Recalculate the time total
                    let startDate = new Date(record.inDate.trim() + ' ' + record.inTime.trim() + ':01');
                    let endDate = new Date(record.outDate.trim() + ' ' + newValue.trim() + ':01');
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    
                    record.totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
                }
                else if( dataIndex === 'temperature' ) {
                    // Nothing to do here
                }
                else if( dataIndex === 'note' ) {
                    // Nothing to do here
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
                updateGridCellColor(rowIndex);
            }
            // Was the tab key pressed?
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[employeesGrid.getColumnDataIndex(colIndex)] = newValue;
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                employeesGrid.updateRow(rowIndex, record);
                updateGridCellColor(rowIndex);
                
                // Edit the next cell
                if( dataIndex === 'inDate' ) {
                    // Edit the cell in the next column
                    editGridCell(rowIndex, colIndex + 1, false);
                }
                else if( dataIndex === 'inTime' ) {
                    // Edit the cell in the next column
                    editGridCell(rowIndex, colIndex + 1, false);
                }
                else if( dataIndex === 'outDate' ) {
                    // Edit the cell in the next column
                    editGridCell(rowIndex, colIndex + 1, false);
                }
                else if( dataIndex === 'outTime' ) {
                    // Edit the cell in the next column
                    editGridCell(rowIndex, colIndex + 1, false);
                }
                else if( dataIndex === 'temperature' ) {
                    // Edit the cell in the next column
                    editGridCell(rowIndex, colIndex + 1, false);
                }
                else if( dataIndex === 'note' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < employeesGrid.getRowCount() ) {
                        // Get details of the next row
                        let nextRecord = employeesGrid.getRow(rowIndex + 1);
                        
                        // Is the employee signed in?
                        if( nextRecord.isSignedIn && !nextRecord.isSignedOut) {
                            // // Is the employee signed out?
                            // if( nextRecord.isSignedOut ) {
                            //     // Edit the next row
                            //     editGridCell(rowIndex + 1, colIndex - 1, false);
                            // }
                            // else {
                                // Edit the next row
                                editGridCell(rowIndex + 1, colIndex - 3, false);
                            // }
                        }
                        else {
                            // Edit the next row
                            editGridCell(rowIndex + 1, colIndex - 5, false);
                        }
                    }
                }
            }
        });
        
        // Focus on the new component
        if( focus === true ) newComponent.focus();
        
        // Set the value of the new component
        newComponent.setValue( value );
        
        // Select the text if it is a text component
        if( dataIndex === 'inTime' || dataIndex === 'outTime' || dataIndex === 'temperature' || dataIndex === 'note' ) {
            newComponent.select();
        }
    }
    
    // Function to set the text color of the grid amount depedning on the value it contains
    //
    // rowIndex         The row index of the cell to edit.
    function updateGridCellColor(rowIndex) {
        // Don't continue if row index is out of bounds
        if( rowIndex >= employeesGrid.getRowCount() ) {
            return;
        }
        
        let colIndex = 3;
        let record = employeesGrid.getRow(rowIndex);
        let value = record[employeesGrid.getColumnDataIndex(colIndex)];
        
        // Remove the unit part and format the value
        value = value.slice(0, -2);
        value = lx.util.parseCurrency(value);
        if( isNaN(value) ) {
            value = '0.00';
        }
        value = lx.util.parseCurrency(value);
        
        if( record.isSignedIn && !record.isSignedOut ) {
            employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#E74C3C'; // '#C0C0C0'; // '#E74C3C';
            employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = '#E74C3C'; // '#C0C0C0'; // '#E74C3C';
            employeesGrid.getCellContainer(rowIndex, colIndex+2).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
            employeesGrid.getCellContainer(rowIndex, colIndex+3).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
        }
        // else if( record.isSignedOut ) {
        //     employeesGrid.getCellContainer(rowIndex, colIndex).style.color = '#FC8C3A'; // '#C0C0C0'; // '#E74C3C';
        //     employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = '#FC8C3A'; // '#C0C0C0'; // '#E74C3C';
        //     employeesGrid.getCellContainer(rowIndex, colIndex+2).style.color = '#FC8C3A'; // '#C0C0C0'; // '#E74C3C';
        //     employeesGrid.getCellContainer(rowIndex, colIndex+3).style.color = '#FC8C3A'; // '#C0C0C0'; // '#E74C3C';
        // }
        else {
            employeesGrid.getCellContainer(rowIndex, colIndex).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
            employeesGrid.getCellContainer(rowIndex, colIndex+1).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
            employeesGrid.getCellContainer(rowIndex, colIndex+2).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
            employeesGrid.getCellContainer(rowIndex, colIndex+3).style.color = lx.style.global.color; // '#58B983' // '#02BD79';
        }
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            lastNote: null
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
                backgroundColor: '#F5F6F7',
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
            innerHTML: '<i class="fa fa-fw fa-user-clock" style="margin: 0px 15px 0px 0px;"></i>Capture Attendance'
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
                'Attendance Details (1/2)'
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
                // maxWidth: '980px'
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
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
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
                'This function allows you to capture attendance for multiple employees at once. Please enter the attendance ' + 
                'details below and click on the &QUOT;Next&QUOT; button to display a list of employees from where you can ' + 
                'review and edit the details before finalising the capture.'
        });
        
        let attendanceDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                margin: '0px auto',
                minWidth: '500px'
            }
        });
        
        // Create signInTimeContainerEl element
        signInTimeContainerEl = lx.createElement('DIV', {
            parent: attendanceDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                maxWidth: '500px',
                margin: '0px 0px 0px 0px',
                padding: '15px',
                border: '1px solid #DFDFDF',
                borderRadius: '7.5px',
                backgroundColor: '#F5F6F7'
            }
        });
        
        signInDate = new lx.component.DatePicker({
            renderTo: signInTimeContainerEl,
            label: 'Date In *',
            // labelAlign: 'left',
            // labelWidth: '120px',
            flex: '1 1 100%',
            maxWidth: '300px'
        });
        signInDate.setValue(new Date().toISOString().slice(0, 10));
        
        signInTimeTxt = new lx.component.Textbox({
            renderTo: signInTimeContainerEl,
            label: 'Time In *',
            // labelAlign: 'left',
            // labelWidth: '80px',
            maxWidth: '120px',
            margin: '0px 0px 0px auto'
        });
        // let hours = new Date().getHours();
        // let minutes = new Date().getMinutes();
        
        // if(hours < 10) {
        //     hours = '0' + hours;
        // }
        // if(minutes < 10) {
        //     minutes = '0' + minutes;
        // }
        // signInTimeTxt.setValue(hours + ':' + minutes);
        signInTimeTxt.setValue('07:30');
        
        // Create signOutTimeContainerEl element
        signOutTimeContainerEl = lx.createElement('DIV', {
            parent: attendanceDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                maxWidth: '500px',
                margin: '15px 0px 0px 0px',
                padding: '15px',
                border: '1px solid #DFDFDF',
                borderRadius: '7.5px',
                backgroundColor: '#F5F6F7'
            }
        });
        
        signOutDate = new lx.component.DatePicker({
            renderTo: signOutTimeContainerEl,
            label: 'Date Out *',
            // labelAlign: 'left',
            // labelWidth: '120px',
            flex: '1 1 100%',
            maxWidth: '300px'
        });
        signOutDate.setValue(new Date().toISOString().slice(0, 10));
        
        signOutTimeTxt = new lx.component.Textbox({
            renderTo: signOutTimeContainerEl,
            label: 'Time Out *',
            // labelAlign: 'left',
            // labelWidth: '80px',
            maxWidth: '120px',
            margin: '0px 0px 0px auto'
        });
        // hours = new Date().getHours();
        // minutes = new Date().getMinutes();
        
        // if(hours < 10) {
        //     hours = '0' + hours;
        // }
        // if(minutes < 10) {
        //     minutes = '0' + minutes;
        // }
        // signOutTimeTxt.setValue(hours + ':' + minutes);
        signOutTimeTxt.setValue('16:00');
        
        // Create the temperatureTxt component
        temperatureTxt = new lx.component.Textbox({
            renderTo: attendanceDetailsSectionEl,
            label: 'Temperature',
            // labelAlign: 'left',
            // labelWidth: '220px',
            margin: '15px 0px 0px 0px',
            maxWidth: '500px'
        });
        
        // Create the noteTxt component
        noteTxt = new lx.component.Textbox({
            renderTo: attendanceDetailsSectionEl,
            label: 'Note',
            multiline: true,
            height: '95px',
            margin: '15px 0px 0px 0px',
            maxWidth: '500px'
        });
        if( compConfig.lastNote !== null ) noteTxt.setValue(compConfig.lastNote);
        
        
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
        
        let page2NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
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
            parent: page2NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '25px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page2NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                '<div>' +
                    'Please review the attendance details below and select the employees. The details in columns marked with the ' + 
                    '<i class="fas fa-fw fa-pen" style="margin: 0px 0px; font-size: 12px;"></i> ' +
                    'icon can be edited by clicking on the value you wish to edit. Click on the &QUOT;Finish&QUOT; ' +
                    'button to allocate the attendance to the selected employees.' +
                '</div>'
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
                {dataIndex: 'employeeAlias', name: 'Employee Name', minWidth: '100px', maxWidth: '200px'},
                {dataIndex: 'inDate', name: 'Date In' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '145px', alignment: 'left'},
                {dataIndex: 'inTime', name: 'Time In' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '85px', alignment: 'right'},
                {dataIndex: 'outDate', name: 'Date Out' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '145px', alignment: 'left'},
                {dataIndex: 'outTime', name: 'Time Out' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '85px', alignment: 'right'},
                {dataIndex: 'temperature', name: 'Temperature' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', width: '105px', alignment: 'left'},
                {dataIndex: 'note', name: 'Note' + '<i class="fas fa-fw fa-pen" style="margin-left: 10px; font-size: 12px; color: #30313C;">', alignment: 'left'},
                {dataIndex: 'totalTime', name: 'Total Time', minWidth: '100px', maxWidth: '150px', alignment: 'left'}
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
        // loadAttendanceTypes();
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
        signInDate.focus();
        // attendanceTypeSelect.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // employeesGrid cell click event handler
    function employeesGridCellClickEventHandler(clickEvent) {
        // Get the data index of the column that was clicked
        let dataIndex = employeesGrid.getColumnDataIndex(clickEvent.columnIndex);
        let record = employeesGrid.getRow(clickEvent.rowIndex);
        
        // Do not allow to edit the in date if the user is signed in
        if( (dataIndex === 'inDate') && (record.isSignedIn && !record.isSignedOut) ) {
            new lx.component.Messagebox({
                title: 'Unable To Edit Date',
                message: 'The date cannot be changed since the specified employee (' + record.employeeAlias + ') is currently signed in.'
            });
            return;
        }
        
        // Do not allow to edit the in time if the user is signed in
        if( (dataIndex === 'inTime') && (record.isSignedIn && !record.isSignedOut) ) {
            new lx.component.Messagebox({
                title: 'Unable To Edit Time',
                message: 'The time cannot be changed since the specified employee (' + record.employeeAlias + ') is currently signed in.'
            });
            return;
        }
        
        // // Do not allow to edit the in date if the user is signed out
        // if( (dataIndex === 'outDate') && (record.isSignedOut) ) {
        //     new lx.component.Messagebox({
        //         title: 'Unable To Edit Date',
        //         message: 'The date cannot be changed since the specified employee (' + record.employeeAlias + ') is currently signed out.'
        //     });
        //     return;
        // }
        
        // // Do not allow to edit the in time if the user is signed out
        // if( (dataIndex === 'outTime') && (record.isSignedOut) ) {
        //     new lx.component.Messagebox({
        //         title: 'Unable To Edit Time',
        //         message: 'The time cannot be changed since the specified employee (' + record.employeeAlias + ') is currently signed out.'
        //     });
        //     return;
        // }
        
        // Depending on the column clicked
        if( (dataIndex === 'inDate') || (dataIndex === 'inTime') || (dataIndex === 'outDate') || 
            (dataIndex === 'outTime') || (dataIndex === 'temperature') || (dataIndex === 'note') ) {
            // Edit the cell
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
            wizardHeadingEl.innerHTML = 'Attendance Details (' + pageNum + '/2)';
            
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
        
        // Get the current date and time
        let currentHours = new Date().getHours();
        if( currentHours < 10 ) {
            currentHours = '0' + currentHours;
        }
        
        let currentMinutes = new Date().getMinutes();
        if( currentMinutes < 10 ) {
            currentMinutes = '0' + currentMinutes;
        }
        
        let now = new Date().toISOString().slice(0, 10); 
        
        // Depending on the page we're on
        if( pageNum === 1 ) {
            // Do sanity checks
            if( (signInDate.getValue() === null) || (signInDate.getValue().trim() === '') ) {
                wizardNextBtn.showWarning(
                    'No &QUOT;Date In&QUOT; specified. Please set the sign-in date.'
                );
                return;
            }
            else if( (signInTimeTxt.getValue() === null) || (signInTimeTxt.getValue().trim() === '') ) {
                wizardNextBtn.showWarning(
                    'No &QUOT;Time In&QUOT; specified. Please set the sign-in time.'
                );
                return;
            }
            else if( (signOutDate.getValue() === null) || (signOutDate.getValue().trim() === '') ) {
                wizardNextBtn.showWarning(
                    'No &QUOT;Date Out&QUOT; specified. Please set the sign-out date.'
                );
                return;
            }
            else if( (signOutTimeTxt.getValue() === null) || (signOutTimeTxt.getValue().trim() === '') ) {
                wizardNextBtn.showWarning(
                    'No &QUOT;Time Out&QUOT; specified. Please set the sign-out time.'
                );
                return;
            }
            
            // Is the sign-in date valid?
            if( !signInDate.isValid() ) {
                wizardNextBtn.showWarning('&QUOT;Date In&QUOT; is invalid. Please enter a valid date in CCYY-MM-DD format.');
                return;
            }
            
            // Is the sign-in time valid?
            if (!lx.util.checkTimeFormat(signInTimeTxt.getValue())) {
                wizardNextBtn.showWarning('&QUOT;Time In&QUOT; is invalid. Please enter a valid time in HH:MM format.');
                return;
            }
            
            // Is the sign-out date valid?
            if( !signOutDate.isValid() ) {
                wizardNextBtn.showWarning('&QUOT;Date Out&QUOT; is invalid. Please enter a valid date in CCYY-MM-DD format.');
                return;
            }
            
            // Is the sign-out time valid?
            if (!lx.util.checkTimeFormat(signOutTimeTxt.getValue())) {
                wizardNextBtn.showWarning('&QUOT;Time Out&QUOT; is invalid. Please enter a valid time in HH:MM format.');
                return;
            }
            
            // Make certian the sign-out time is after the sign in time
            if( (signOutDate.getValue().trim() + signOutTimeTxt.getValue().trim()) <= (signInDate.getValue().trim() + signInTimeTxt.getValue().trim()) ) {
                wizardNextBtn.showWarning('The sign-out date and time must be after the sign-in date and time.');
                return;
            }
            
            // Make certian the sign-in date or time is not in the future
            if( signInDate.getValue().trim() > now) {
                wizardNextBtn.showWarning('Sign in date cannot be in the future.');
                return;
            }
            else if( signInDate.getValue() == now ) {
                if ( signInTimeTxt.getValue() > (currentHours + ':' + currentMinutes) ) {
                    wizardNextBtn.showWarning('Sign in time cannot be in the future.');
                    return;
                }
            }
            
            // Make certian the sign-out date or time is not in the future
            if( signOutDate.getValue().trim() > now) {
                wizardNextBtn.showWarning('Sign out date cannot be in the future.');
                return;
            }
            else if( signOutDate.getValue() == now ) {
                if ( signOutTimeTxt.getValue() > (currentHours + ':' + currentMinutes) ) {
                    wizardNextBtn.showWarning('Sign out time cannot be in the future.');
                    return;
                }
            }
            
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            
            // Load employee attendance
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=getAttendance',
                data: {
                    departmentId: null
                },
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    
                    // Check if the function was successful.
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to load employee attendance',
                            message: response.error
                        });
                        return;
                    }
                    
                    // Was no employees found?
                    if( response.attendance.employees.length <= 0 ) {
                        wizardNextBtn.showWarning(
                            'No employees found.'
                        );
                        return;
                    }
                    
                    // Populate grid
                    var employees = [];
                    for( var i = 0; i < response.attendance.employees.length; i++ ) {
                        // Get the sign-in and sign-out times for the employee
                        let inDate = response.attendance.employees[i].timeInDate;
                        let inTime = response.attendance.employees[i].timeIn;
                        let outDate = response.attendance.employees[i].timeOutDate;
                        let outTime = response.attendance.employees[i].timeOut;
                        let hasConflict = false;
                        let isSignedIn = false;
                        let isSignedOut = false;
                        
                        // Was a sign-in date and time specified?
                        if( inDate != null ) {
                            if( outDate != null ) {
                                inDate = signInDate.getValue();
                                inTime = signInTimeTxt.getValue();
                            }
                            isSignedIn = true;
                        }
                        else {
                            inDate = signInDate.getValue();
                            inTime = signInTimeTxt.getValue();
                        }
                        
                        // // Was a sign-out date and time specified?
                        // if( outDate == null ) {
                        //     outDate = signOutDate.getValue();
                        // }
                        // else {
                        //     isSignedOut = true;
                        // }
                        
                        // if( outTime == null ) {
                        //     outTime = signOutTimeTxt.getValue();
                        // }
                        // else {
                        //     // inTime = outTime;
                        //     // outTime = '';
                        // }
                        
                        // Was a sign-out date and time specified?
                        if( outDate != null ) {
                            isSignedOut = true;
                        }
                        
                        outDate = signOutDate.getValue();
                        outTime = signOutTimeTxt.getValue();
                        
                        // Set the total time
                        let startDate = new Date(inDate.trim() + ' ' + inTime.trim() + ':01');
                        let endDate = new Date(outDate.trim() + ' ' + outTime.trim() + ':01');
                        let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                        
                        let totalTime = '<div style="font-size: 12px; text-wrap: wrap;">' + secondsToTime(seconds) + '</div>';
                        
                        // Add the employee details
                        employees.push({
                            select: false,
                            employeeId: response.attendance.employees[i].id,
                            employeeAttendancesId: response.attendance.employees[i].employeeAttendancesId,
                            employeeCode: response.attendance.employees[i].code,
                            employeeAlias: response.attendance.employees[i].alias,
                            inDate: inDate,
                            inTime: inTime,
                            outDate: outDate,
                            outTime: outTime,
                            totalTime: totalTime,
                            temperature: temperatureTxt.getValue(),
                            note: noteTxt.getValue(),
                            isSignedIn: isSignedIn,
                            isSignedOut: isSignedOut,
                            spacer: ''
                        });
                    }
                    
                    // Clear the grid and add the new rows
                    employeesGrid.clear();
                    employeesGrid.addRows( employees );
                    
                    // Update the amount color
                    for( let rowIndex = 0; rowIndex < employeesGrid.getRowCount(); rowIndex++ ) {
                        updateGridCellColor(rowIndex);
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
            
            // Make certain all the values in the grid are valid
            for( let rowIndex = 0; rowIndex < employeesGrid.getRowCount(); rowIndex++ ) {
                // Get the row details
                let record = employeesGrid.getRow(rowIndex);
                
                // Do sanity checks
                if( (record.inDate === null) || (record.inDate.trim() === '') ) {
                    wizardNextBtn.showWarning(
                        'No &QUOT;Date In&QUOT; specified for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please set the sign-in date.'
                    );
                    return;
                }
                else if( (record.inTime === null) || (record.inTime.trim() === '') ) {
                    wizardNextBtn.showWarning(
                        'No &QUOT;Time In&QUOT; specified for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please set the sign-in time.'
                    );
                    return;
                }
                else if( (record.outDate === null) || (record.outDate.trim() === '') ) {
                    wizardNextBtn.showWarning(
                        'No &QUOT;Date Out&QUOT; specified for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please set the sign-out date.'
                    );
                    return;
                }
                else if( (record.outTime === null) || (record.outTime.trim() === '') ) {
                    wizardNextBtn.showWarning(
                        'No &QUOT;Time Out&QUOT; specified for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please set the sign-out time.'
                    );
                    return;
                }
                
                // Is the sign-in date valid?
                if( !isValidDate( record.inDate ) ) {
                    wizardNextBtn.showWarning('&QUOT;Date In&QUOT; is invalid for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please enter a valid date in CCYY-MM-DD format.');
                    return;
                }
                
                // Is the sign-in time valid?
                if( !lx.util.checkTimeFormat( record.inTime ) ) {
                    wizardNextBtn.showWarning('&QUOT;Time In&QUOT; is invalid for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please enter a valid time in HH:MM format.');
                    return;
                }
                
                // Is the sign-out date valid?
                if( !isValidDate( record.outDate ) ) {
                    wizardNextBtn.showWarning('&QUOT;Date Out&QUOT; is invalid for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please enter a valid date in CCYY-MM-DD format.');
                    return;
                }
                
                // Is the sign-out time valid?
                if( !lx.util.checkTimeFormat( record.outTime ) ) {
                    wizardNextBtn.showWarning('&QUOT;Time Out&QUOT; is invalid for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '. Please enter a valid time in HH:MM format.');
                    return;
                }
                
                // Make certian the sign-out time is after the sign in time
                if( (record.outDate.trim() + record.outTime.trim()) <= (record.inDate.trim() + record.inTime.trim()) ) {
                    wizardNextBtn.showWarning('The sign-out date and time must be after the sign-in date and time for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + '.');
                    return;
                }
                
                // Make certian the sign-in date or time is not in the future
                if( record.inDate.trim() > now) {
                    wizardNextBtn.showWarning('Sign in date for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + ' cannot be in the future.');
                    return;
                }
                else if( record.inDate.trim() == now ) {
                    if ( record.inTime > (currentHours + ':' + currentMinutes) ) {
                        wizardNextBtn.showWarning('Sign in time for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + ' cannot be in the future.');
                        return;
                    }
                }
                
                // Make certian the sign-out date or time is not in the future
                if( record.outDate.trim() > now) {
                    wizardNextBtn.showWarning('Sign out date for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + ' cannot be in the future.');
                    return;
                }
                else if( record.outDate.trim() == now ) {
                    if ( record.outTime > (currentHours + ':' + currentMinutes) ) {
                        wizardNextBtn.showWarning('Sign out time for ' + record.employeeAlias + ' (' + record.employeeCode + ') on line ' + (rowIndex + 1) + ' cannot be in the future.');
                        return;
                    }
                }
            }
            
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
                    employeeAttendancesId: record.employeeAttendancesId,
                    inDate: record.inDate,
                    inTime: record.inTime,
                    outDate: record.outDate,
                    outTime: record.outTime,
                    temperature: record.temperature,
                    note: record.note
                });
            }
            
            // Ask the user for permission if any sign-in times are in the future
            // ...
            
            // Allocate attendance
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=bulkAllocate',
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
                            title: 'Unable to allocate attendance',
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
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};