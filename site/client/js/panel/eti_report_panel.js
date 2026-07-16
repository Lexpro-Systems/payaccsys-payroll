/* globals app, lx */
'use strict';

// ETI REPORT PANEL
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
app.panel.EtiReport = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
  
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var filterSectionEl = null;
    var filterTaxPeriodSelect = null;
    var filterMonthSelect = null;

    var initialisingFilters = false;

    // var filterMonth = null;
    
    var resultGrid = null;
    var gridContainerEl = null;
    
    
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

    function formatYesNo(value) {
        return value === true ? 'Y' : 'N';
    }

    // Function to load tax periods from the database
    function loadTaxPeriods(selectedTaxYear) {
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getTaxYearList',
            data: {
                searchString: '',
                limit: 20,
                offset: filterTaxPeriodSelect.getItemCount(),
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Periods Failed',
                        message: response.error
                    });
                    return;
                }
                
                var taxYears = [];

                //To create fallback values in case the default (current year) is not found in the list of tax years from db
                var selectedTaxYearFound = false;
                var fallbackValue = null;
                var fallbackText = null;
                var selectedTaxYearText = (selectedTaxYear - 1) + ' / ' + selectedTaxYear;
                var minimumEtiTaxYear = 2026;
                
                for( var i = 0; i < response.taxYears.length; i++ ) {
                    var taxYear = parseInt(response.taxYears[i].year, 10);

                    if( taxYear < minimumEtiTaxYear ) {
                        continue;
                    }

                    var taxYearValue = String(taxYear);
                    var taxYearText = (taxYear - 1) + ' / ' + taxYear;
                    
                    if( fallbackValue === null ) {
                        fallbackValue = taxYearValue;
                        fallbackText = taxYearText;
                    }

                    taxYears.push({
                        value: taxYearValue,
                        text: taxYearText
                    });

                    if( taxYearValue === String(selectedTaxYear) ) {
                        selectedTaxYearFound = true;
                        fallbackValue = taxYearValue;
                        fallbackText = taxYearText;
                    }
                }

                filterTaxPeriodSelect.addItems( taxYears );

                if( fallbackValue === null ) {
                    return;
                }

                initialisingFilters = true;
                filterTaxPeriodSelect.setValue(fallbackValue, fallbackText);
                initialisingFilters = false;

                loadReport(true);
            }
        });
    }
    
    // Function to load the report
    function loadReport( clearGrid ) {
        
        // Set filterMonth
        let filterMonth = '';
        filterMonth = String(filterMonthSelect.getValue() || '');
        
        // Get the report details
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEtiData',
            data: {
                taxPeriod: filterTaxPeriodSelect.getValue(),
                month: filterMonthSelect.getValue()
            },
            onSuccess: function( responseText ) {

            // console.log('Status: success');
            // console.log('Raw responseText:', responseText);
            // console.log('Response length:', responseText ? responseText.length : 0);

                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading ETI Report Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Get all the report details
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                        employees.push({
                            code: response.employees[i].code,
                            name: response.employees[i].name,
                            surname: response.employees[i].surname,
                            employeeId: response.employees[i].employeeId,
                            dateOfBirth: response.employees[i].dateOfBirth,
                            age: response.employees[i].age,
                            employmentStartDate: response.employees[i].employmentStartDate,
                            employmentEndDate: response.employees[i].employmentEndDate,
                            etiEligible: formatYesNo(response.employees[i].etiEligible),
                            secondYear: formatYesNo(response.employees[i].secondYear),
                            totalHoursWorked: response.employees[i].totalHoursWorked,
                            effectiveHourlyRate: formatGridAmount(response.employees[i].effectiveHourlyRate),
                            basicWage: formatGridAmount(response.employees[i].basicWage),
                            actual: formatGridAmount(response.employees[i].actual),
                            monthlyEquivalent: formatGridAmount(response.employees[i].monthlyEquivalent),
                            etiAmount: formatGridAmount(response.employees[i].etiAmount),
                            completed: formatYesNo(response.employees[i].completed)
                        });
                   // }
                }
                
                // Display total row
                employees.push({
                    code: 'Total',
                    name: '',
                    surname: '',
                    employeeId: null,
                    dateOfBirth: '',
                    employmentStartDate: '',
                    etiEligible: '',
                    secondYear: '',
                    totalHoursWorked: '',
                    effectiveHourlyRate: '',
                    basicWage: '',
                    actual: '',
                    monthlyEquivalent: '',
                    etiAmount: formatGridAmount(response.totals.etiAmountTotal),
                    completed: ''
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
            innerHTML: 'ETI Report'
        });
        
        // Create the exportExcelBtn component
        exportExcelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Excel Export',
            width: '130px',
            margin: '0px 0px 0px auto',
            
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
                //alignItems: 'center',
                alignItems: 'flex-start',
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
        
        // Create the filterSectionEl element
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
        
        // Create filterTaxPeriodSelect component
        filterTaxPeriodSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            label: 'Tax Period',
            margin: '0px 20px 0px 0px',
            
            onChange: filterTaxPeriodSelectOnChangeEventHandler
        });
        
        // Create filterMonthSelect component
        filterMonthSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            label: 'Month',
            margin: '0px 20px 0px 0px',
            
            items: app.commonSelectOptions.months,

            
            
            onChange: filterMonthOnChangeEventHandler
        });

        // Create the element used to position the tooltip
        let filterSectionTooltipLocusEl = lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 2px 0px',
                width: '0px',
                height: '20px'
            }
        });
        
        // Create an info icon
        let filterSectionInfoEl = lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px 8px 0px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the tooltip component
        let filterSectionTooltip = new lx.component.Tooltip({
            renderTo: filterSectionTooltipLocusEl,
            position: 'relative',
            alignment: 'bottomLeft',
            arrowOffset: '7px',
            width: '100%',
            maxWidth: '700px',
            margin: '5px 5px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message:
                    '<span style="font-size: 12px;">' +  
                        'This report automatically excludes employees employed before 1 August 2019 from ETI calculations, as their historical ETI qualifying months cannot be reliably determined by the report.' +
                    '</span>'
        });
        filterSectionInfoEl.addEventListener('mouseenter', function() { filterSectionTooltip.show(); });
        filterSectionInfoEl.addEventListener('mouseleave', function() { filterSectionTooltip.hide(); })

        //console.log(app.commonSelectOptions.months);

        //
        // RESULT GRID
        //

        gridContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                width: 'max-content',
                minWidth: '100%',
                //flex: '0 0 auto',
                flex: '1 1 100%',
                overflow: 'visible'
            }
        });
        
        resultGrid = new lx.component.Grid({
            renderTo: gridContainerEl,
            width: '100%',
            //flex: '0 0 auto',
            //minWidth: '100%',
            flex: '1 1 100%',
            columns: [
                {name: 'Code', dataIndex: 'code', type: 'button', width: '60px', padding: '0px 10px 0px 10px'},
                {name: 'Name', dataIndex: 'name', width: '100px', padding: '0px 10px 0px 0px'}, 

                {name: 'Surname', dataIndex: 'surname', width: '110px', padding: '0px 10px 0px 0px'},
                {name: 'Age', dataIndex: 'age', width: '40px', alignment: 'left', padding: '0px 10px 0px 0px'},
                
                {name: 'Emp Start Date', dataIndex: 'employmentStartDate', minWidth: '110px', alignment: 'center', padding: '0px 10px 0px 0px'},

                {name: 'ETI Y/N', dataIndex: 'etiEligible', width: '60px', alignment: 'center', padding: '0px 10px 0px 0px'},
                {name: '2nd Year', dataIndex: 'secondYear', width: '60px', alignment: 'center', padding: '0px 10px 0px 0px'},
                {name: 'Hours', dataIndex: 'totalHoursWorked', width: '60px', alignment: 'right', padding: '0px 10px 0px 0px'},
                {name: 'Effective Hourly Rate', dataIndex: 'effectiveHourlyRate', minWidth: '120px', alignment: 'right', padding: '0px 10px 0px 0px'},


                {name: 'Basic Wage', dataIndex: 'basicWage', minWidth: '110px', alignment: 'right', padding: '0px 10px 0px 0px'},
                {name: 'Actual', dataIndex: 'actual', minWidth: '110px', alignment: 'right', padding: '0px 10px 0px 0px'},
                {name: 'Monthly Equivalent', dataIndex: 'monthlyEquivalent', minWidth: '110px', alignment: 'right', padding: '0px 10px 0px 0px'},
                {name: 'ETI Amount', dataIndex: 'etiAmount', width: '100px', alignment: 'right', padding: '0px 10px 0px 0px'},
                {name: 'Completed', dataIndex: 'completed', width: '80px', alignment: 'center', padding: '0px 10px 0px 0px'}
               
            ],
            
            onCellClick: resultGridCellClickEventHandler
        });

        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth() + 1;

        // SA tax year: March 2026 - February 2027 = 2027
        let currentTaxYear = currentMonth >= 3 ? currentYear + 1 : currentYear;

        //Use current date to set default values for tax period and month
        initialisingFilters = true;
        filterMonthSelect.setValue(String(currentMonth));
        initialisingFilters = false;
        loadTaxPeriods(String(currentTaxYear));

        // console.log(filterTaxPeriodSelect.getValue());
        // console.log(filterMonthSelect.getValue());
      

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

    // filterMonthSelect change event handler
    function filterMonthOnChangeEventHandler() {
        //If report is loading defaults at the start, don't trigger onChange event handler
        if( initialisingFilters === true ) return;

        if (filterTaxPeriodSelect.getValue() == null || filterMonthSelect.getValue() == null)  {
            return;
        }

        loadReport(true);
    }

     // filterTaxPeriodSelect change event handler
    function filterTaxPeriodSelectOnChangeEventHandler() {
        //If report is loading defaults at the start, don't trigger onChange event handler
        if( initialisingFilters === true ) return;

        if (filterTaxPeriodSelect.getValue() == null || filterMonthSelect.getValue() == null)  {
            return;
        }
        
        // Display the report
        loadReport(true);
    }
    
    
    // resultGrid cell click event handler
    function resultGridCellClickEventHandler ( event ) {
        // Depending on the ecolumn clicked
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
    
    // exportExcelBtn click event handler
    function exportExcelBtnOnClickEventHandler () {
        exportEtiReport('xlsx');
    }
    
    // exportCsvBtn click event handler
    function exportCsvBtnOnClickEventHandler () {
        exportEtiReport('csv');
        
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
         if (filterTaxPeriodSelect.getValue() == null || filterMonthSelect.getValue() == null) {
        new lx.component.Messagebox({
            title: 'Missing filters',
            message: 'Please select a tax period and month.'
        });
        return;
    }

    lx.sendForm({
        url: 'exec.php?c=Report&fn=runEtiPdfReport',
        target: '_blank',
        data: {
            taxPeriod: filterTaxPeriodSelect.getValue(),
            month: filterMonthSelect.getValue()
        }
    });
    }

    //Export CSV/XLSX report function
    function exportEtiReport(format) {
    if (filterTaxPeriodSelect.getValue() == null || filterMonthSelect.getValue() == null) {
        new lx.component.Messagebox({
            title: 'Missing filters',
            message: 'Please select a tax period and month.'
        });
        return;
    }

    lx.sendForm({
        url: 'exec.php?c=Report&fn=runEtiReport',
        target: '_blank',
        data: {
            format: format,
            taxPeriod: filterTaxPeriodSelect.getValue(),
            month: filterMonthSelect.getValue()
            }
        });
    }

    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};