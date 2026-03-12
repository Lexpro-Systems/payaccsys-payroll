/* globals app, lx */
'use strict';

// EARNINGS COST ANALYSIS REPORT PANEL
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
app.panel.EarningsCostAnalysisReport = function(config) {
    
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
    
    
    // Function to load payruns into the select component
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
    function loadReport() {
        // Should the report be filtered by payrun and was no payrun id specified?
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            // Clear the grid
            resultGrid.clear();
            return;
        }
        
        // Get the report data
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEarningsCostAnalysisList',
            data: {
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: filterPayrunSelect.getValue(),
                startDate: (filterStartDate.getValue().trim() == '' ? null : filterStartDate.getValue().trim()),
                endDate: (filterEndDate.getValue().trim() == '' ? null : filterEndDate.getValue().trim())
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading the report failed',
                        message: response.error
                    });
                }
                
                // Get all the report details
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    employees.push({
                        code: response.employees[i].employeeCode,
                        name: response.employees[i].employeeAlias,
                        employeeId: response.employees[i].employeeId,
                        earnings: lx.util.formatCurrency(response.employees[i].income === null ? 0 : response.employees[i].income),
                        allowances: lx.util.formatCurrency(response.employees[i].allowances === null ? 0 : response.employees[i].allowances),
                        deductions: lx.util.formatCurrency(response.employees[i].deductions === null ? 0 : response.employees[i].deductions),
                        contributions: lx.util.formatCurrency(response.employees[i].companyContributions === null ? 0 : response.employees[i].companyContributions),
                        benefits: lx.util.formatCurrency(response.employees[i].fringeBenefits === null ? 0 : response.employees[i].fringeBenefits)
                    });
                }
                
                // Add a row for the totals
                employees.push({
                    code: 'Total',
                    name: '',
                    employeeId: null,
                    earnings: lx.util.formatCurrency(response.total.incomeTotal === null ? 0 : response.total.incomeTotal),
                    allowances: lx.util.formatCurrency(response.total.allowancesTotal === null ? 0 : response.total.allowancesTotal),
                    deductions: lx.util.formatCurrency(response.total.deductionsTotal === null ? 0 : response.total.deductionsTotal),
                    contributions: lx.util.formatCurrency(response.total.companyContributionsTotal === null ? 0 : response.total.companyContributionsTotal),
                    benefits: lx.util.formatCurrency(response.total.fringeBenefitsTotal === null ? 0 : response.total.fringeBenefitsTotal)
                });
                
                // Clear the grid and set the data
                resultGrid.clear();
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
            innerHTML: 'Earnings / Cost Analysis Report'
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
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                padding: '20px'
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
        let taxYearStartDate = new Date(currentDate.getFullYear(), 2, 1);
        let month = null;
        let day = null;
        
        // Is it before march of the current year?
        if( currentDate.getMonth() + 1 < 3 ) {
            // The tax year starts last year
            taxYearStartDate = new Date(currentDate.getFullYear()-1, 2, 1);
        }
        
        // Format the month
        month = (taxYearStartDate.getMonth()+1);
        if( month < 10 ) {
            month = '0' + month;
        }
        else {
            month = month + '';
        }
        
        // Format the day
        day = taxYearStartDate.getDate();
        if( day < 10 ) {
            day = '0' + day;
        }
        else {
            day = day + '';
        }
        
        filterStartDate.setValue( taxYearStartDate.getFullYear() + '-' + month  + '-' + day);
        
        // Create the filterEndDate component
        filterEndDate = new lx.component.DatePicker({
            renderTo: filterPeriodContainerEl,
            label: 'End Date',
            width: '190px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterChangeEventHandler
        });
        
        // Format the month
        month = (currentDate.getMonth()+1);
        if( month < 10 ) {
            month = '0' + month;
        }
        else {
            month = month + '';
        }
        
        // Format the day
        day = currentDate.getDate();
        if( day < 10 ) {
            day = '0' + day;
        }
        else {
            day = day + '';
        }
        
        // Set default end date to the current date
        filterEndDate.setValue( currentDate.getFullYear() + '-' + month + '-' + day);
        
        // Create the filterDetailRadio component
        filterDetailRadio = new lx.component.RadioGroup({
            renderTo: filterSectionEl,
            label: 'Detail Level',
            width: '300px',
            margin: '0px 0px 0px 20px',
            items: [
                {text: 'Detailed', value: 'detailed'},
                {text: 'Summary', value: 'summary'}
            ],
            
            onChange: filterChangeEventHandler
        });
        filterDetailRadio.setValue('detailed');
        
        
        //
        // RESULT GRID
        //
        
        resultGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                {name: 'Code', dataIndex: 'code', type: 'button', width: '100px', padding: '0px 10px 0px 20px'},
                {name: 'Name', dataIndex: 'name'},
                {name: 'Earnings', dataIndex: 'earnings', width: '150px', alignment: 'right'},
                {name: 'Allowances', dataIndex: 'allowances', width: '150px', alignment: 'right'},
                // {name: 'Gross Earnings', dataIndex: 'grossEarnings', width: '150px', alignment: 'right'},
                {name: 'Deductions', dataIndex: 'deductions', width: '150px', alignment: 'right'},
                {name: 'Company Contributions', dataIndex: 'contributions', width: '150px', alignment: 'right'},
                {name: 'Fringe Benefits', dataIndex: 'benefits', width: '150px', alignment: 'right'}
                // {name: 'Nett Earnings', dataIndex: 'nettEarnings', width: '150px', alignment: 'right'},
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
    
    function resultGridCellClickEventHandler ( event ) {
        if( event.columnIndex === 0 ) {
            
            if (event.record.employeeId === null) {
                return;
            }
            
            me.hide();
            
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
    
    function exportExcelBtnOnClickEventHandler () {
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected.',
                message: 'Please select a payrun.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEarningsCostAnalysisReport',
            target: '_self',
            data: {
                format: 'xls',
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: filterPayrunSelect.getValue(),
                startDate: (filterStartDate.getValue().trim() == '' ? null : filterStartDate.getValue().trim()),
                endDate: (filterEndDate.getValue().trim() == '' ? null : filterEndDate.getValue().trim())
            }
        });
    }
    
    function exportCsvBtnOnClickEventHandler () {
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected.',
                message: 'Please select a payrun.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEarningsCostAnalysisReport',
            target: '_self',
            data: {
                format: 'csv',
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: filterPayrunSelect.getValue(),
                startDate: (filterStartDate.getValue().trim() == '' ? null : filterStartDate.getValue().trim()),
                endDate: (filterEndDate.getValue().trim() == '' ? null : filterEndDate.getValue().trim())
            }
        });
    }
    
    function exportPdfBtnOnClickEventHandler () {
        if( filterTypeRadio.getValue() === 'PAYR' && filterPayrunSelect.getValue() == null ) {
            new lx.component.Messagebox({
                title: 'No payrun selected.',
                message: 'Please select a payrun.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEarningsCostAnalysisPdfReport',
            target: '_blank',
            data: {
                detail: filterDetailRadio.getValue(),
                filterType: filterTypeRadio.getValue(),
                payrunId: filterPayrunSelect.getValue(),
                startDate: (filterStartDate.getValue().trim() == '' ? null : filterStartDate.getValue().trim()),
                endDate: (filterEndDate.getValue().trim() == '' ? null : filterEndDate.getValue().trim())
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // The filters have been changed, re-load the report
    function filterChangeEventHandler() {
        loadReport();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};