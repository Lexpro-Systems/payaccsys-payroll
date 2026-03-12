/* globals app, lx */
'use strict';

// TEMPLATE PANEL
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
app.panel.EmpReport = function(config) {
    
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
    var filterDetailRadio = null;
    
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
                }
                
                var taxYears = [];
                let defaultValue = null;
                let defaultText = null;
                for( var i = 0; i < response.taxYears.length; i++ ) {
                    if( i == 0 ) {
                        defaultValue = response.taxYears[i].year;
                        defaultText = (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year;
                    }
                    
                    taxYears.push({
                        value: response.taxYears[i].year,
                        text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    });
                }
                
                filterTaxPeriodSelect.addItems( taxYears );
                filterTaxPeriodSelect.setValue( defaultValue, defaultText );
            }
        });
    }
    
    // Function to load EMP 201 report
    function displayEmp201Report() {
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEmp201List',
            data: {
                taxYear: filterTaxPeriodSelect.getValue(),
                monthNumber: parseInt(filterMonthSelect.getValue()),
                detail: filterDetailRadio.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading EMP 201 report failed',
                        message: response.error
                    });
                }
                
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    
                    employees.push({
                        code: response.employees[i].employeeCode,
                        name: response.employees[i].employeeAlias,
                        employeeId: response.employees[i].employeeId,
                        paye: lx.util.formatCurrency(response.employees[i].paye),
                        uif: lx.util.formatCurrency(response.employees[i].uif),
                        sdl: lx.util.formatCurrency(response.employees[i].sdl)
                    });
                }
                
                employees.push({
                    code: 'Total',
                    name: '',
                    employeeId: null,
                    paye: lx.util.formatCurrency(response.total.payeTotal),
                    uif: lx.util.formatCurrency(response.total.uifTotal),
                    sdl: lx.util.formatCurrency(response.total.sdlTotal)
                });
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
            innerHTML: 'EMP 201'
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
            
            onChange: filterTaxPeriodSelectOnChangeEventHandler
        });
        
        // Create the filterDetailRadio component
        filterDetailRadio = new lx.component.RadioGroup({
            renderTo: filterSectionEl,
            label: 'Detail Level',
            width: '300px',
            margin: '0px 0px 0px 0px',
            items: [
                {text: 'Detailed', value: 'detailed'},
                {text: 'Summary', value: 'summary'}
            ],
            
            onChange: filterDetailRadioEventHandler
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
                {name: 'PAYE', dataIndex: 'paye', width: '150px', alignment: 'right'},
                {name: 'UIF', dataIndex: 'uif', width: '150px', alignment: 'right'},
                {name: 'SDL', dataIndex: 'sdl', width: '150px', alignment: 'right'},
            ],
            
            onCellClick: resultGridCellClickEventHandler
        });
        
        loadTaxPeriods();
        
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
    
    // resultGrid cell click event handler
    function resultGridCellClickEventHandler ( event ) {
        // Was the employee name column clicked?
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
    
    // exportExcelBtn click event handler
    function exportExcelBtnOnClickEventHandler () {
        // Do sanity checks
        if( (filterTaxPeriodSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the EMP 201 report.'
            });
            return;
        }
        else if( (filterMonthSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No month selected',
                message: 'Please select a month for the EMP 201 report.'
            });
            return;
        }
        
        // Generate the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmp201Report',
            target: '_self',
            data: {
                format: 'xls',
                taxYear: filterTaxPeriodSelect.getValue(),
                monthNumber: parseInt(filterMonthSelect.getValue()),
                detail: filterDetailRadio.getValue()
            }
        });
    }
    
    // exportCsvBtn click event handler
    function exportCsvBtnOnClickEventHandler () {
        // Do sanity checks
        if( (filterTaxPeriodSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the EMP 201 report.'
            });
            return;
        }
        else if( (filterMonthSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No month selected',
                message: 'Please select a month for the EMP 201 report.'
            });
            return;
        }
        
        // Generate the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmp201Report',
            target: '_self',
            data: {
                format: 'csv',
                taxYear: filterTaxPeriodSelect.getValue(),
                monthNumber: parseInt(filterMonthSelect.getValue()),
                detail: filterDetailRadio.getValue()
            }
        });
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Do sanity checks
        if( (filterTaxPeriodSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No tax period selected',
                message: 'Please select a tax period for the EMP 201 report.'
            });
            return;
        }
        else if( (filterMonthSelect.getValue() == null) ) {
            new lx.component.Messagebox({
                title: 'No month selected',
                message: 'Please select a month for the EMP 201 report.'
            });
            return;
        }
        
        // Generate the report
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmp201PdfReport',
            target: '_blank',
            data: {
                detail: filterDetailRadio.getValue(),
                taxYear: filterTaxPeriodSelect.getValue(),
                monthNumber: parseInt(filterMonthSelect.getValue())
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // filterDetailRadio change event handler
    function filterDetailRadioEventHandler() {
        if( (filterTaxPeriodSelect.getValue() == null) || (filterMonthSelect.getValue() == null) ) {
            return;
        }
        
        // Display the report
        displayEmp201Report();
    }
    
    // filterTaxPeriodSelect change event handler
    function filterTaxPeriodSelectOnChangeEventHandler() {
        if( (filterMonthSelect.getValue() == null) ) {
            return;
        }
        
        // Display the report
        displayEmp201Report();
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};