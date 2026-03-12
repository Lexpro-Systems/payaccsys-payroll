/* globals app, lx */
'use strict';

// UIF REPORT PANEL
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
app.panel.UifReport = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var uifDeclarationBtn = null;
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var filterSectionEl = null;
    var filterTypeRadio = null;
    var filterPayrunSelectContainerEl = null;
    var filterPayrunSelect = null;
    var filterPeriodContainerEl = null;
    var filterStartDate = null;
    var filterEndDate = null;
    var filterDetailRadio = null;
    
    var resultGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to format an amount for display in a grid
    function formatGridAmount( amount ) {
        
        let html = '<span style="font-size: 14px;">';
        html = html + lx.util.formatCurrency(amount === null ? '0.00' : amount);
        html = html + '</span>';
        
        return html;
    }
    
    // Function to load payruns for the filter
    function loadPayruns() {
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getList',
            data: {
                searchString: filterPayrunSelect.getSearchString(),
                limit: 20,
                offset: filterPayrunSelect.getItemCount(),
                sortList: [
                    {'dataIndex': 'toDate', 'order': 'DESC'}
                ]
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payruns Failed',
                        message: response.error
                    });
                }
                
                var payruns = [];
                for( var i = 0; i < response.payruns.length; i++ ) {
                    payruns.push({
                        value: response.payruns[i].id,
                        text: response.payruns[i].description
                    });
                }
                
                filterPayrunSelect.addItems( payruns );
            }
        });
    }
    
    // Function to load the report
    function loadReport( clearGrid ) {
        // Should the report be filtered by payrun and was no payrun id specified?
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            // Clear the grid
            resultGrid.clear();
            return;
        }
        
        // Set report values depending on the filter type
        let startDate = '';
        let endDate = '';
        let payrunId = null;
        
        if( filterTypeRadio.getValue() === 'PAYR' ) {
            payrunId = filterPayrunSelect.getValue();
        }
        else {
            startDate = filterStartDate.getValue().trim();
            endDate = filterEndDate.getValue().trim();
        }
        
        // Get the report details
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getUifList',
            data: {
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: payrunId,
                startDate: (startDate == '' ? null : startDate),
                endDate: (endDate == '' ? null : endDate)
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading employees failed',
                        message: response.error
                    });
                    return;
                }
                
                // Get all the report details
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    // Should a detailed report be displayed?
                    if( filterDetailRadio.getValue() === 'DETA' ) {
                        // Add the employee details
                        employees.push({
                            code: response.employees[i].code,
                            name: response.employees[i].alias,
                            employeeId: response.employees[i].id,
                            uifReferenceNumber: response.employees[i].uifReferenceNumber,
                            idNumber: response.employees[i].idNumber,
                            passportNumber: response.employees[i].passportNumber,
                            employmentStartDate: response.employees[i].employmentStartDate,
                            employmentEndDate: response.employees[i].employmentEndDate,
                            totalHoursWorked: response.employees[i].totalHoursWorked,
                            taxableRemuneration: formatGridAmount(response.employees[i].taxableRemuneration),
                            uifRemuneration: formatGridAmount(response.employees[i].uifRemuneration),
                            uifContribution: formatGridAmount(response.employees[i].uifContribution)
                        });
                    }
                }
                
                // Display the total
                employees.push({
                    code: 'Total',
                    name: '',
                    employeeId: null,
                    totalHoursWorked: response.totals.hoursWorkedTotal,
                    taxableRemuneration: formatGridAmount(response.totals.taxableRemunerationTotal),
                    uifRemuneration: formatGridAmount(response.totals.uifRemunerationTotal),
                    uifContribution: formatGridAmount(response.totals.uifContributionTotal)
                });
                
                // Should the grid be cleared?
                if( clearGrid ) {
                    resultGrid.clear();
                }
                
                // Add the data to the grid
                resultGrid.addRows( employees );
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
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
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
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'UIF Report'
        });
        
        // Create the uifDeclarationBtn component
        uifDeclarationBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'UIF Declaration',
            width: '130px',
            margin: '0px 0px 0px auto',
            
            onClick: uifDeclarationBtnOnClickEventHandler
        });
        
        // Create the exportExcelBtn component
        exportExcelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Excel Export',
            width: '130px',
            margin: '0px 0px 0px 20px',
            
            onClick: exportExcelBtnOnClickEventHandler
        });
        
        // Create the exportCsvBtn component
        exportCsvBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'CSV Export',
            width: '130px',
            margin: '0px 0px 0px 20px',
            
            onClick: exportCsvBtnOnClickEventHandler
        });
        
        // Create the exportPdfBtn component
        exportPdfBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'PDF Export',
            width: '130px',
            margin: '0px 20px 0px 20px',
            
            onClick: exportPdfBtnOnClickEventHandler
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row'
            }
        });
        
        // Create the filterTypeRadio component
        filterTypeRadio = new lx.component.RadioGroup({
            renderTo: filterSectionEl,
            label: 'Filter By',
            width: '300px',
            margin: '0px 0px 0px 20px',
            items: [
                {text: 'Payrun', value: 'PAYR'},
                {text: 'Period', value: 'PERI'}
            ],
            
            onChange: function() {
                // Should the payrun filters be applied?
                if( filterTypeRadio.getValue() === 'PAYR' ) {
                    filterPayrunSelectContainerEl.style.display = 'flex';
                    filterPeriodContainerEl.style.display = 'none';
                }
                else {
                    filterPayrunSelectContainerEl.style.display = 'none';
                    filterPeriodContainerEl.style.display = 'flex';
                    filterStartDate.focus();
                }
                
                // The filters have been udpated
                filterChangeEventHandler();
            }
        });
        filterTypeRadio.setValue('PAYR');
        
        // Create the filterPayrunSelectContainerEl element
        filterPayrunSelectContainerEl = lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px 20px',
                minWidth: '400px',
                maxWidth: '400px',
                display: 'block'
            }
        });
        
        // Create filterPayrunSelect component
        filterPayrunSelect = new lx.component.Selectbox({
            renderTo: filterPayrunSelectContainerEl,
            margin: '0px 0px 0px 0px',
            width: '100%',
            label: 'Select Payrun',
            
            search: true,
            
            onSearch: function() {
                filterPayrunSelect.clear();
                loadPayruns();
            },
            
            onListScrollEnd: function() {
                loadPayruns();
            },
            
            onChange: filterChangeEventHandler
        });
        
        // Create the filterPeriodContainerEl element
        filterPeriodContainerEl = lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'none'
            }
        });
        
        // Create the filterStartDate component
        filterStartDate = new lx.component.DatePicker({
            renderTo: filterPeriodContainerEl,
            label: 'Start Date',
            width: '190px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterChangeEventHandler
        });
        
        // Set default start date to the beginnig of the financial year
        let currentDate = new Date();
        let month = null;
        let day = null;
        
        // Get the start of the financial year
        // let taxYearStartDate = new Date(currentDate.getFullYear(), 2, 1);
        
        // // Is it before march of the current year?
        // if( currentDate.getMonth() + 1 < 3 ) {
        //     // The tax year starts last year
        //     taxYearStartDate = new Date(currentDate.getFullYear()-1, 2, 1);
        // }
        
        // // Format the month
        // month = (taxYearStartDate.getMonth()+1);
        // if( month < 10 ) {
        //     month = '0' + month;
        // }
        // else {
        //     month = month + '';
        // }
        
        // // Format the day
        // day = taxYearStartDate.getDate();
        // if( day < 10 ) {
        //     day = '0' + day;
        // }
        // else {
        //     day = day + '';
        // }
        
        // Get the first day of the current month
        let currentMonthStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Format the month
        month = (currentMonthStartDate.getMonth()+1);
        if( month < 10 ) {
            month = '0' + month;
        }
        else {
            month = month + '';
        }
        
        // Format the day
        day = currentMonthStartDate.getDate();
        if( day < 10 ) {
            day = '0' + day;
        }
        else {
            day = day + '';
        }
        
        filterStartDate.setValue( currentMonthStartDate.getFullYear() + '-' + month  + '-' + day);
        
        // Create the filterEndDate component
        filterEndDate = new lx.component.DatePicker({
            renderTo: filterPeriodContainerEl,
            label: 'End Date',
            width: '190px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterChangeEventHandler
        });
        
        // Get the last day of the current month
        let currentMonthEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Format the month
        month = (currentMonthEndDate.getMonth()+1);
        if( month < 10 ) {
            month = '0' + month;
        }
        else {
            month = month + '';
        }
        
        // Format the day
        day = currentMonthEndDate.getDate();
        if( day < 10 ) {
            day = '0' + day;
        }
        else {
            day = day + '';
        }
        
        // Set default end date to the current date
        filterEndDate.setValue( currentMonthEndDate.getFullYear() + '-' + month + '-' + day);
        
        // Create the filterDetailRadio component
        filterDetailRadio = new lx.component.RadioGroup({
            renderTo: filterSectionEl,
            label: 'Detail Level',
            width: '300px',
            margin: '0px 0px 0px 20px',
            items: [
                {text: 'Detailed', value: 'DETA'},
                {text: 'Summary', value: 'SUMM'}
            ],
            
            onChange: filterChangeEventHandler
        });
        filterDetailRadio.setValue('DETA');
        
        
        //
        // RESULT GRID
        //
        
        resultGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                {name: 'Code', dataIndex: 'code', type: 'button', width: '80px', padding: '0px 10px 0px 20px'},
                {name: 'Name', dataIndex: 'name'},
                {name: 'UIF Reference', dataIndex: 'uifReferenceNumber', width: '110px', alignment: 'left'},
                {name: 'ID Number', dataIndex: 'idNumber', width: '130px', alignment: 'left'},
                {name: 'Pasport Number', dataIndex: 'passportNumber', width: '130px', alignment: 'left'},
                {name: 'Empl. Start Date', dataIndex: 'employmentStartDate', width: '110px', alignment: 'center'},
                {name: 'Empl. End Date', dataIndex: 'employmentEndDate', width: '110px', alignment: 'center'},
                {name: 'Hours Worked', dataIndex: 'totalHoursWorked', width: '90px', alignment: 'right'},
                {name: 'Taxable Remuneration', dataIndex: 'taxableRemuneration', width: '150px', alignment: 'right'},
                {name: 'UIF Remuneration', dataIndex: 'uifRemuneration', width: '150px', alignment: 'right'},
                {name: 'UIF Contribution', dataIndex: 'uifContribution', width: '150px', alignment: 'right'}
            ],
            
            onCellClick: resultGridCellClickEventHandler
        });
        
        loadPayruns();
        
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
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // The filters have been changed, re-load the report
    function filterChangeEventHandler() {
        loadReport( true );
    }
    
    // resultGrid cell click event handler
    function resultGridCellClickEventHandler ( event ) {
        // Depending on th ecolumn clicked
        if( resultGrid.getColumnDataIndex( event.columnIndex ) === 'code' ) {
            // Was an employee id specified?
            if (event.record.employeeId === null) {
                return;
            }
            
            // Hide the current panel
            me.hide();
            
            // Dsiplay the panel to view the employee
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                employeeId: event.record.employeeId,
                employeeName: event.record.name
            });
            
            var panelState = {
                previousPanel: me,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    // uifDeclarationBtn click event handler
    function uifDeclarationBtnOnClickEventHandler () {
        // This function is still being tested - only enable it for lexpro bookset
        lx.sendJSON({
            url: 'exec.php?c=User&fn=get',
            onSuccess: function( jsonResult ) {
                let result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load user details'
                    });
                    
                    return;
                }
                
                // Set company and user details
                // if( result.user.company.name !== 'Lexpro' ) {
                //     new lx.component.Messagebox({
                //         title: 'UIF Declaration',
                //         message: 'Coming soon!'
                //     });
                //     return;
                // }
                
                // Do sanity checks
                if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
                    new lx.component.Messagebox({
                        title: 'No payrun selected',
                        message: 'Please select a payrun or specify a period.'
                    });
                    return;
                }
                
                // Set report values depending on the filter type
                let startDate = '';
                let endDate = '';
                let payrunId = null;
                
                if( filterTypeRadio.getValue() === 'PAYR' ) {
                    payrunId = filterPayrunSelect.getValue();
                }
                else {
                    startDate = filterStartDate.getValue().trim();
                    endDate = filterEndDate.getValue().trim();
                }
                
                // Create a modal window
                var exportUifDeclarationModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '640px',
                    maxHeight: '674px'
                });
                
                // Create the exportReconciliationPanel panel
                var exportUifDeclarationPanel = new app.panel.ExportUifDeclaration({
                    renderTo: exportUifDeclarationModal.getContainer(),
                    show: true,
                    
                    payrunId: payrunId,
                    startDate: (startDate == '' ? null : startDate),
                    endDate: (endDate == '' ? null : endDate),
                
                    onExport: function() {
                        app.route.popState();
                    },
                    onCancel: function() {
                        app.route.popState();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                exportUifDeclarationModal.addEventListener('destroy', function() {
                    exportUifDeclarationPanel.destroy();
                });
                
                // Create a route entry for the panel
                let state = {
                    modal: exportUifDeclarationModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                exportUifDeclarationModal.show();
                exportUifDeclarationPanel.focus();
            }
        });
    }
    
    // exportExcelBtn click event handler
    function exportExcelBtnOnClickEventHandler () {
        // Do sanity checks
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected',
                message: 'Please select a payrun or specify a period.'
            });
            return;
        }
        
        // Set report values depending on the filter type
        let startDate = '';
        let endDate = '';
        let payrunId = null;
        
        if( filterTypeRadio.getValue() === 'PAYR' ) {
            payrunId = filterPayrunSelect.getValue();
        }
        else {
            startDate = filterStartDate.getValue().trim();
            endDate = filterEndDate.getValue().trim();
        }
        
        // Download the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runUifReport',
            target: '_self',
            data: {
                format: 'xls',
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: payrunId,
                startDate: (startDate == '' ? null : startDate),
                endDate: (endDate == '' ? null : endDate)
            }
        });
    }
    
    // exportCsvBtn click event handler
    function exportCsvBtnOnClickEventHandler () {
        // Do sanity checks
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected',
                message: 'Please select a payrun or specify a period.'
            });
            return;
        }
        
        // Set report values depending on the filter type
        let startDate = '';
        let endDate = '';
        let payrunId = null;
        
        if( filterTypeRadio.getValue() === 'PAYR' ) {
            payrunId = filterPayrunSelect.getValue();
        }
        else {
            startDate = filterStartDate.getValue().trim();
            endDate = filterEndDate.getValue().trim();
        }
        
        // Download the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runUifReport',
            target: '_self',
            data: {
                format: 'csv',
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: payrunId,
                startDate: (startDate == '' ? null : startDate),
                endDate: (endDate == '' ? null : endDate)
            }
        });
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Do sanity checks
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected',
                message: 'Please select a payrun or specify a period.'
            });
            return;
        }
        
        // Set report values depending on the filter type
        let startDate = '';
        let endDate = '';
        let payrunId = null;
        
        if( filterTypeRadio.getValue() === 'PAYR' ) {
            payrunId = filterPayrunSelect.getValue();
        }
        else {
            startDate = filterStartDate.getValue().trim();
            endDate = filterEndDate.getValue().trim();
        }
        
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runUifPdfReport',
            target: '_blank',
            data: {
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: payrunId,
                startDate: (startDate == '' ? null : startDate),
                endDate: (endDate == '' ? null : endDate)
            }
        });
    }
    
    /*
    // filterDetailRadio change event handler
    function filterDetailRadioEventHandler() {
        // Do nothing if no payrun was selected
        if( filterPayrunSelect.getValue() === null ) {
            return;
        }
        
        // Load the report
        loadReport( true );
    }
    
    // The filterPayrunSelect change event handler
    function filterPayrunSelectOnChangeEventHandler() {
        // Load the report
        loadReport( true );
    }
    */
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};