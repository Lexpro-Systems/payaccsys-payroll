/* globals app, lx */
'use strict';

// YEAR TO DATE REPORT PANEL
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
app.panel.YearToDateReport = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;

    var el = null;

    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;

    var filterContainerEl = null;
    var employeeSelect = null;
    var financialYearSelect = null;
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    var financialYear = null;
    var employees = [];
    var emp = [];
    var taxYears = [];
    var ytdSummary = [];

    var loaderContainerEl = null;
    var contentContainerEl = null;
    var resultContainerEl = null;
    var loader = null;

    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PRIVATE FUNCTIONS
    //

    function loadEmployees(srcSelect) {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: srcSelect.getSearchString(),
                offset: srcSelect.getItemCount(),
                sortList: [
                    { 'dataIndex': 'name', 'order': 'ASC' }
                ]
            },
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }

                employees = [];
                for (var i = 0; i < response.employees.length; i++) {
                    employees.push({
                        value: response.employees[i].id,
                        code: response.employees[i].code,
                        name: response.employees[i].Fullname,
                        surname: response.employees[i].Lastname,
                        dateOfBirth: response.employees[i].dateOfBirth,
                        employmentDate: response.employees[i].employmentStartDate,
                        employmentEndDate: response.employees[i].employmentEndDate,
                        employmentStatus: response.employees[i].employmentStatus,
                        text:
                            '<div class="flex-row" style="width: 100%; overflow: hidden;">' +
                            '<div class="flex-resize" style="overflow: hidden; text-overflow: ellipsis; ' +
                            'margin: 0px 5px 0px 0px;">' +
                            response.employees[i].alias +
                            '</div>' +
                            '<div class="flex-noresize" style="overflow: hidden; text-overflow: ellipsis; ' +
                            'margin: 0px 5px 0px 0px;">' +
                            response.employees[i].code +
                            '</div>' +
                            '</div>'
                    });
                }

                srcSelect.addItems(employees);
            }
        });
    }
    function loadTaxYears() {
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getTaxYearList',
            data: {
                searchString: '',
                limit: 20,
                offset: financialYearSelect.getItemCount(),
                sortOrder: 'DESC'
            },
            onSuccess: function (responseText) {
                loader.hide();
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Periods Failed',
                        message: response.error
                    });
                }

                taxYears = [];
                var defaultTaxYear = null;
                for (var i = 0; i < response.taxYears.length; i++) {
                    if (i === 0) {
                        defaultTaxYear = {
                            value: response.taxYears[i].year,
                            fromDate: (response.taxYears[i].year - 1) + '-03-01',
                            toDate: response.taxYears[i].year + '-02-28',
                            text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                        };
                    }
                    taxYears.push({
                        value: response.taxYears[i].year,
                        fromDate: (response.taxYears[i].year - 1) + '-03-01',
                        toDate: response.taxYears[i].year + '-02-28',
                        text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    });
                }
                financialYearSelect.addItems(taxYears);
                financialYearSelect.setValue(defaultTaxYear.value, defaultTaxYear.text);
            }
        });
    }

    function loadYearItems(selectedEmployee, startDate, endDate) {
        loader.show();
        //check
        resultContainerEl.innerHTML = '';
        ytdSummary = [];
        financialYear = `${startDate} - ${endDate}`;

        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=ydtEmployeePayslipItems',
            data: {
                employeeId: selectedEmployee.value,
                startDate: startDate,
                endDate: endDate
            },

            onSuccess: function (responseText) {
                loader.hide();

                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Error Loading Report',
                        message: response.error || 'Failed to load report data.'
                    });
                    return;
                }

                var ytdData = response.ytdData;

                //console.log('YTD DATA:', ytdData);
                emp = [];

                const months = [
                    'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December',
                    'January', 'February'
                ];

                const categoryTitles = {
                    INCO: 'Earnings',
                    DEDU: 'Deductions',
                    CONT: 'Company Contributions',
                    FBEN: 'Fringe Benefits',
                    ALLO: 'Allowances'
                };

                const incomeCats = ['INCO', 'ALLO', 'FBEN'];

                //
                // =========================
                // CATEGORY GRIDS
                // =========================
                //
                const categoryOrder = ['INCO', 'DEDU', 'CONT', 'FBEN', 'ALLO'];
                const sortedCategories = Object.keys(ytdData).sort((a, b) => {
                    let indexA = categoryOrder.indexOf(a);
                    let indexB = categoryOrder.indexOf(b);
                    if (indexA === -1) indexA = 999;
                    if (indexB === -1) indexB = 999;
                    return indexA - indexB;
                });

                sortedCategories.forEach(function (category) {

                    if (Object.keys(ytdData[category]).length === 0) {
                        return;
                    }

                    let categoryTitle = categoryTitles[category] || category;

                    let categoryContainerEl = lx.createElement('DIV', {
                        parent: resultContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            width: 'max-content',
                            flex: '0 0 auto',
                            overflow: 'visible',
                            marginBottom: '20px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
                        }
                    });

                    let gridContainerEl = lx.createElement('DIV', {
                        parent: categoryContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            display: 'flex',
                            overflow: 'visible'
                        }
                    });

                    let ytdGrid = new lx.component.Grid({
                        renderTo: gridContainerEl,
                        flex: '1 1 100%',
                        borderWidth: '0px',

                        columns: [
                            {
                                dataIndex: 'description',
                                name: '<b>' + categoryTitle + '</b>',
                                width: '250px',
                                padding: '0px 0px 0px 15px'
                            },
                            ...months.map((m, idx) => ({
                                dataIndex: m,
                                name: m.substring(0, 3),
                                width: '90px',
                                alignment: 'right',
                                padding: idx === months.length - 1 ? '0px 15px 0px 0px' : undefined
                            })),
                            {
                                dataIndex: 'TOTAL',
                                name: 'Total',
                                width: '100px',
                                alignment: 'right',
                                padding: '0px 15px 0px 0px'
                            }
                        ]
                    });

                    let rows = [];
                    let totals = {};

                    months.forEach(m => totals[m] = 0);

                    Object.keys(ytdData[category]).forEach(function (itemCode) {

                        let item = ytdData[category][itemCode];

                        let row = {
                            description: itemCode,
                            net_pay: item.net_pay
                        };

                        let rowTotal = 0;

                        months.forEach(function (month) {

                            let val = Number(item[month] || 0);

                            row[month] = val.toFixed(2);

                            rowTotal += val;
                            totals[month] += val;
                        });

                        row.TOTAL = rowTotal.toFixed(2);

                        rows.push(row);
                    });

                    let totalRow = {
                        description: 'TOTAL'
                    };

                    let grandTotal = 0;

                    months.forEach(function (month) {
                        totalRow[month] = totals[month].toFixed(2);
                        grandTotal += totals[month];
                    });

                    totalRow.TOTAL = grandTotal.toFixed(2);

                    rows.push(totalRow);

                    ytdGrid.clear();
                    ytdGrid.addRows(rows);

                    ytdSummary.push({
                        category: category,
                        items: rows
                    });
                });

                //
                // =========================
                // NET INCOME CALCULATION
                // =========================
                //
                let netMonths = {};
                months.forEach(m => netMonths[m] = 0);

                Object.keys(ytdData).forEach(function (category) {

                    Object.keys(ytdData[category]).forEach(function (itemCode) {

                        let item = ytdData[category][itemCode];

                        months.forEach(function (month) {

                            let val = Number(item[month] || 0);

                            // INCOME SIDE (net_pay required)
                            if (
                                incomeCats.includes(category) &&
                                item.net_pay === true
                            ) {
                                netMonths[month] += val;
                            }

                            // DEDUCTIONS (net_pay required)
                            if (
                                category === 'DEDU'
                            ) {
                                netMonths[month] -= val;
                            }
                        });
                    });
                });

                //
                // NET ROW
                //
                let netRow = {
                    description: 'Net-Pay'
                };

                let grandNet = 0;

                months.forEach(function (month) {
                    let val = netMonths[month];

                    netRow[month] = val.toFixed(2);
                    grandNet += val;
                });

                netRow.TOTAL = grandNet.toFixed(2);

                //
                // NET GRID
                //
                let netContainerEl = lx.createElement('DIV', {
                    parent: resultContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        width: 'max-content',
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '4px solid #10b981',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
                    }
                });

                let netGridContainerEl = lx.createElement('DIV', {
                    parent: netContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        display: 'flex'
                    }
                });

                let netGrid = new lx.component.Grid({
                    renderTo: netGridContainerEl,
                    flex: '1 1 100%',
                    borderWidth: '0px',

                    columns: [
                        {
                            dataIndex: 'description',
                            name: '<b>NET INCOME</b>',
                            width: '250px',
                            padding: '0px 0px 0px 15px'
                        },
                        ...months.map((m, idx) => ({
                            dataIndex: m,
                            name: m.substring(0, 3),
                            width: '90px',
                            alignment: 'right',
                            padding: idx === months.length - 1 ? '0px 15px 0px 0px' : undefined
                        })),
                        {
                            dataIndex: 'TOTAL',
                            name: 'Total',
                            width: '100px',
                            alignment: 'right',
                            padding: '0px 15px 0px 0px'
                        }
                    ]
                });

                netGrid.clear();
                netGrid.addRows([netRow]);

                ytdSummary.push({
                    category: 'NET',
                    items: [netRow]
                });

                //
                // =========================
                // GRAND TOTAL CALCULATION
                // =========================
                //
                let grandTotals = {};
                months.forEach(m => grandTotals[m] = 0);

                let grandYearTotal = 0;

                // Sum the TOTAL row from each category (excluding NET)
                ytdSummary.forEach(function (categoryData) {

                    if (categoryData.category === 'NET' || categoryData.category === 'DEDU') {
                        return;
                    }

                    let totalRow = categoryData.items.find(r => r.description === 'TOTAL');

                    if (!totalRow) {
                        return;
                    }

                    months.forEach(function (month) {
                        grandTotals[month] += Number(totalRow[month] || 0);
                    });

                    grandYearTotal += Number(totalRow.TOTAL || 0);
                });

                let grandTotalRow = {
                    description: 'Grand Total'
                };

                months.forEach(function (month) {
                    grandTotalRow[month] = grandTotals[month].toFixed(2);
                });

                grandTotalRow.TOTAL = grandYearTotal.toFixed(2);

                //
                // =========================
                // GRAND TOTAL GRID
                // =========================
                //
                let grandTotalContainerEl = lx.createElement('DIV', {
                    parent: resultContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        width: 'max-content',
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '4px solid #2563eb',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
                    }
                });

                let grandTotalGridContainerEl = lx.createElement('DIV', {
                    parent: grandTotalContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        display: 'flex'
                    }
                });

                let grandTotalGrid = new lx.component.Grid({
                    renderTo: grandTotalGridContainerEl,
                    flex: '1 1 100%',
                    borderWidth: '0px',

                    columns: [
                        {
                            dataIndex: 'description',
                            name: '<b>GRAND TOTAL</b>',
                            width: '250px',
                            padding: '0px 0px 0px 15px'
                        },
                        ...months.map((m, idx) => ({
                            dataIndex: m,
                            name: m.substring(0, 3),
                            width: '90px',
                            alignment: 'right',
                            padding: idx === months.length - 1
                                ? '0px 15px 0px 0px'
                                : undefined
                        })),
                        {
                            dataIndex: 'TOTAL',
                            name: 'Total',
                            width: '100px',
                            alignment: 'right',
                            padding: '0px 15px 0px 0px'
                        }
                    ]
                });

                grandTotalGrid.clear();
                grandTotalGrid.addRows([grandTotalRow]);

                ytdSummary.push({
                    category: 'Grand Total',
                    items: [grandTotalRow]
                });

                emp.push({
                    //id : empDetails.value,
                    Name: selectedEmployee.name,
                    Code: selectedEmployee.code,
                    Surname: selectedEmployee.surname,
                    DateOfBirth: selectedEmployee.dateOfBirth,
                    EmploymentDate: selectedEmployee.employmentDate,
                    EmploymentEndDate: selectedEmployee.employmentEndDate,
                    EmploymentStatus: selectedEmployee.employmentStatus

                })

                // console.log('YTD Summary:', ytdSummary);
                // console.log('Employee Data:', emp);
            }
        });
    }

    //
    // PUBLIC FUNCTIONS
    //

    me.init = function (config) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false
        };

        // Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

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
        titleBackEl.appendChild(lx.icon.create('left_arrow', '#444D5A', 18, 1.2));
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild(titleBackEl);

        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Year to Date Report'
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
        // FILTER SECTION
        //

        // Container for displaying filters
        filterContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#EFEFEF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                margin: '0px 0px 0px 0px',
                padding: '15px 20px'
            }
        });

        // Create employeeSelect component
        employeeSelect = new lx.component.Selectbox({
            renderTo: filterContainerEl,
            label: 'Employee',
            maxWidth: '400px',
            margin: '0px 0px 0px 0px',
            search: true,
            onSearch: function () {
                employeeSelect.clear();
                loadEmployees(employeeSelect);
            },

            onChange: filterOnChangeEvent
        });

        // Create the taxYearSelect component
        financialYearSelect = new lx.component.Selectbox({
            renderTo: filterContainerEl,
            label: 'Tax Year:',
            margin: '0px 0px 0px 20px',
            maxWidth: '200px',
            onChange: filterOnChangeEvent
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

        contentContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%'
            }
        });

        resultContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                width: '100%',
                padding: '20px',
                overflowX: 'auto',    // Horizontal scroll
                overflowY: 'auto'     // Vertical scroll
            }
        });

        // Initialize employees list
        loadEmployees(employeeSelect);
        loadTaxYears();

        // If show is set to true show the panel.
        if (compConfig.show === true) me.show();
    };

    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function (renderTo) {
        // Remove it from its current target
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        // Add it to the new renderTo element
        renderTo.appendChild(el);
    };

    // Function to show the panel
    me.show = function () {
        lx.applyStyle(el, { display: 'flex' });
    };

    // Function to hide the panel
    me.hide = function () {
        lx.applyStyle(el, { display: 'none' });
    };

    // Function to set focus to the panel.
    me.focus = function () {
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function () {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);

        // Remove the panel from its parent
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        return true;
    };


    //
    // EVENT HANDLERS
    //

    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }

    // The event that is fired when a filter is changed
    function filterOnChangeEvent() {

        let empId = employeeSelect.getValue();
        let selectedYearVal = financialYearSelect.getValue();

        if (!empId || !selectedYearVal) {
            return;
        }

        let selectedEmployee = employees.find(emp => emp.value == empId);

        let selectedYear = taxYears.find(function (item) {
            return item.value === selectedYearVal;
        });

        if (!selectedYear) return;

        loadYearItems(selectedEmployee, selectedYear.fromDate, selectedYear.toDate);
    }

    function exportExcelBtnOnClickEventHandler() {
        if (employeeSelect.getValue() === null) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }

        lx.sendForm({
            url: 'exec.php?c=Report&fn=runYtdReport',
            target: '_self',
            data: {
                format: 'xls',
                employeeId: employeeSelect.getValue(),
                details: ytdSummary,
                employee: emp,
                financialYear: financialYear,
                // startDate: startDate.getValue(),
                // endDate: endDate.getValue()
            }
        });
    }

    function exportCsvBtnOnClickEventHandler() {
        if (employeeSelect.getValue() === null) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }

        lx.sendForm({
            url: 'exec.php?c=Report&fn=runYtdReport',
            target: '_self',
            data: {
                format: 'csv',
                employeeId: employeeSelect.getValue(),
                details: ytdSummary,
                employee: emp,
                financialYear: financialYear,
                // startDate: startDate.getValue(),
                // endDate: endDate.getValue()
            }
        });
    }

    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler() {
        // Do sanity checks
        if (employeeSelect.getValue() === null) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }

        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runYtdPdfReport',
            target: '_blank',
            data: {
                Pdfdetails: ytdSummary,
                Employee: emp,
                financialYear: financialYear,
                // startDate: startDate.getValue(),
                // endDate: endDate.getValue()
            }
        });
    }
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }


    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};
