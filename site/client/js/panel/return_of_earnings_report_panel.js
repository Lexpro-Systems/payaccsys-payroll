/* globals app, lx */
'use strict';

// RETURN OF EARNINGS REPORT PANEL
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
app.panel.ReturnOfEarningsReport = function(config) {
    
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
    var filterDepartmentSelect = null;
    var filterDisableEarningsCapRadio = null;
    var earningsCapTooltip = null
    
    var resultGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load tax periods from the database
    function loadTaxPeriods() {
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
                for( var i = 0; i < response.taxYears.length; i++ ) {
                    taxYears.push({
                        value: response.taxYears[i].year,
                        text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    });
                }
                filterTaxPeriodSelect.addItems( taxYears );
            }
        });
    }
    
    // Function to load departments from the database
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: filterDepartmentSelect.getSearchString(),
                limit: 10,
                offset: filterDepartmentSelect.getItemCount() -1,
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                    return;
                }
                
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                }
                filterDepartmentSelect.addItems( departments );
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
            innerHTML: 'Return of Earnings (ROE) Report'
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
                alignItems: 'center',
                boxSizing: 'border-box',
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
        
        // Create filterTaxPeriodSelect component
        filterTaxPeriodSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '150px',
            label: 'Tax Period',
            margin: 'auto 20px 0px 0px',
            
            onChange: filterOnChangeEventHandler
        });
        
        // Create filterDepartmentSelect component
        filterDepartmentSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            maxWidth: '250px',
            height: '32px',
            margin: 'auto 20px 0px 0px',
            label: 'Departments',
            
            search: true,
            
            onSearch: function() {
                filterDepartmentSelect.clear();
                var departments = [];
                departments.push({
                    value: null,
                    text: 'All Departments'
                });
                filterDepartmentSelect.addItems( departments );
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                loadDepartments();
            },
            
            onChange: filterOnChangeEventHandler
        });
        
        var departments = [];
        departments.push({
            value: null,
            text: 'All Departments'
        });
        filterDepartmentSelect.addItems( departments );
        filterDepartmentSelect.setValue(null, 'All Departments');
        
        // Create the filterDisableEarningsCapRadio component
        filterDisableEarningsCapRadio = new lx.component.RadioGroup({
            renderTo: filterSectionEl,
            label: 'Disable Earnings Threshold',
            width: '200px',
            margin: 'auto 20px 0px 0px',
            items: [
                {text: 'Yes', value: true},
                {text: 'No', value: false}
            ],
            
            onChange: filterOnChangeEventHandler
        });
        filterDisableEarningsCapRadio.setValue(false);
        
        // Create the tooltipLocusEl element
        let tooltipLocusEl = lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                position: 'relative',
                margin: 'auto 0px auto 0px',
                width: '0px',
                height: '90%'
            }
        });
        
        // Create an info icon
        let fileNumberInfoEl = new lx.createElement('DIV', {
            parent: filterSectionEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px 5px 0px',
                fontSize: '12px',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        fileNumberInfoEl.addEventListener('mouseenter', function() { earningsCapTooltip.show(); });
        fileNumberInfoEl.addEventListener('mouseleave', function() { earningsCapTooltip.hide(); });
        
        // Create earningsCapTooltip element
        earningsCapTooltip = new lx.component.Tooltip({
            renderTo: tooltipLocusEl,
            alignment: 'bottomLeft',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '420px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'Please note that the amount of earnings (staff costs/salaries & wages) should be capped to the prescribed ' + 
                    'maximum amount per person for the selected tax period for the purposes of the Return  of Earnings (ROE) report.' +
                    '<br><br>' +
                    'The threshold is implemented by divding the prescribed maximum amount by the number of months of the ' +
                    'report (12) and capping the monthly earnings of each employee to this amount.' +
                '</span>'
        });
        
        
        //
        // RESULT GRID
        //
        
        resultGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                {name: 'Month', dataIndex: 'month', padding: '0px 10px 0px 20px'},
                {name: 'Number of Employees', dataIndex: 'employeeCount', width: '150px', alignment: 'right'},
                {name: 'Earnings (Rands Only)', dataIndex: 'grossIncomeAmount', width: '200px', alignment: 'right'}
            ]
        });
        
        loadTaxPeriods();
        loadDepartments();
        
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
    
    // exportExcelBtn click event handler
    function exportExcelBtnOnClickEventHandler () {
        // Was NO tax period selected?
        if( filterTaxPeriodSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the Return of Earnings (ROE) report.'
            });
            return;
        }
        
        // Run the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runReturnOfEarningsReport',
            target: '_self',
            data: {
                format: 'xls',
                taxYear: filterTaxPeriodSelect.getValue(),
                departmentId: filterDepartmentSelect.getValue(),
                disableEarningsCap: filterDisableEarningsCapRadio.getValue()
            }
        });
    }
    
    // exportCsvBtn click event handler
    function exportCsvBtnOnClickEventHandler () {
        // Was NO tax period selected?
        if( filterTaxPeriodSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the Return of Earnings (ROE) report.'
            });
            return;
        }
        
        // Run the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runReturnOfEarningsReport',
            target: '_self',
            data: {
                format: 'csv',
                taxYear: filterTaxPeriodSelect.getValue(),
                departmentId: filterDepartmentSelect.getValue(),
                disableEarningsCap: filterDisableEarningsCapRadio.getValue()
            }
        });
    }
    
    // exportCsvBtn click event handler
    function exportPdfBtnOnClickEventHandler() {
        // Was NO tax period selected?
        if( filterTaxPeriodSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the Return of Earnings (ROE) report.'
            });
            return;
        }
        
        // Run the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runReturnOfEarningsPdfReport',
            target: '_blank',
            data: {
                taxYear: filterTaxPeriodSelect.getValue(),
                departmentId: filterDepartmentSelect.getValue(),
                disableEarningsCap: filterDisableEarningsCapRadio.getValue()
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // filterTaxPeriodSelect change event handler
    function filterOnChangeEventHandler() {
        // Was no tax period selected?
        if( (filterTaxPeriodSelect.getValue() == null) ) {
            earningsCapTooltip.setText(
                '<span style="font-size: 12px;">' +  
                    'Please note that the amount of earnings (staff costs/salaries & wages) should be capped to the prescribed ' + 
                    'maximum amount per person for the selected tax period for the purposes of the Return  of Earnings (ROE) report.' +
                    '<br><br>' +
                    'The threshold is implemented by divding the prescribed maximum amount by the number of months of the ' +
                    'report (12) and capping the monthly earnings of each employee to this amount.' +
                '</span>'
            );
            return;
        }
        
        // Update the tooltip message with the earnings cap
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getCompensationFundEarningCap',
            data: {
                taxYear: parseInt(filterTaxPeriodSelect.getValue())
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok === true ) {
                    earningsCapTooltip.setText(
                        '<span style="font-size: 12px;">' +  
                            'Please note that the amount of earnings (staff costs/salaries & wages) should be capped to the prescribed ' + 
                            'maximum amount per person for the selected tax period for the purposes of the Return  of Earnings (ROE) report.' +
                            '<br><br>' +
                            'The threshold is implemented by divding the prescribed maximum amount by the number of months of the ' +
                            'report (12) and capping the monthly earnings of each employee to this amount.' +
                            '<br><br>' +
                            'The prescribed earnings threshold for the selected period is <b>R ' + 
                            lx.util.formatCurrency( response.earningsCap) + '</b> per annum or <b>R ' + 
                            lx.util.formatCurrency( response.earningsCap/ 12 ) + '</b> per month.' + 
                        '</span>'
                    );
                }
            }
        });
        
        // Get the report and put it in the grid
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getReturnOfEarningsList',
            data: {
                taxYear: filterTaxPeriodSelect.getValue(),
                departmentId: filterDepartmentSelect.getValue(),
                disableEarningsCap: filterDisableEarningsCapRadio.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Return of Earnings Report Failed',
                        message: response.error
                    });
                    return;
                }
                
                var results = [];
                for( let i = 0; i < response.results.length; i++ ) {
                    // Get the month name
                    let monthName = '';
                    for( let j = 0; j < app.commonSelectOptions.months.length; j++ ) {
                        if( response.results[i].month == app.commonSelectOptions.months[j].value ) {
                            monthName = app.commonSelectOptions.months[j].text;
                            break;
                        }
                    }
                    
                    // Add the results for the grid
                    results.push({
                        month: monthName,
                        grossIncomeAmount: lx.util.formatCurrency(response.results[i].grossIncomeAmount).slice(0, -3),
                        employeeCount: lx.util.formatCurrency(response.results[i].employeeCount).slice(0, -3)
                    });
                }
                
                // Add the totals for the grid
                results.push({
                    month: 'Total',
                    grossIncomeAmount: lx.util.formatCurrency(response.totals.grossIncomeTotal).slice(0, -3),
                    employeeCount: ''
                });
                
                // CLear and add the results to the grid
                resultGrid.clear();
                resultGrid.addRows( results );
            }
        });
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};