/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE LEAVE PANEL
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
app.panel.EmployeeLeaveSummaryReport = function (config) {

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
    var startDate = null;
    var endDate = null;

    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var employees = []
    var emp = []
    var employeeLeaveSummary = [];
    var requests = [];
    var loader = null;
    var leaveTypes = [];
    var requestsLoaded = false;
    var summaryLoaded = false;


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
                        name: response.employees[i].Fullname,
                        surname: response.employees[i].Lastname,
                        employmentDate: response.employees[i].employmentStartDate,
                        text:
                            '<div class="flex-row" style="width=100%; overflow: hidden;">' +
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

    // Function to load leave types
    function loadLeaveTypes(empDetails) {
        leaveTypes = [];
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getLeaveTypeList',
            data: {
                //employeeId: config.employeeId,
                employeeId: empDetails.value,
                startDate: (startDate.getValue().trim() !== '' ? startDate.getValue().trim() : null),
                endDate: (endDate.getValue().trim() !== '' ? endDate.getValue().trim() : null),
                //page: "ELSpage"
            },
            onSuccess: function (jsonResult) {
                var result = JSON.parse(jsonResult);

                // Check if the function was successful.
                if (result.ok !== true) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });

                    return;
                }
                emp = [];
                employeeLeaveSummary = [];
                // Add leave type sections
                for (let i = 0; i < result.leaveTypes.length; i++) {

                    if (result.leaveTypes[i].isSubscribed === false) {
                        continue;
                    }
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            margin: '20px 0px 0px 0px',
                            // padding: '0px 0px 20px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF',
                            minWidth: '532px'
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
                        }
                    });

                    // Create the type's heading bar
                    let leaveHeadingContainerEl = lx.createElement('DIV', {
                        parent: typeHeadingEl,
                        style: {
                            margin: '0px 0px 0px 0px',
                            display: 'flex',
                            flexDirection: 'row',
                        }
                    });

                    // Create the menu dropdown button
                    let subscribeCheckbox = new lx.component.Checkbox({
                        renderTo: leaveHeadingContainerEl,
                        label: null,
                        margin: '0px 10px 0px 0px',
                        width: ''
                    });
                    if (result.leaveTypes[i].isSubscribed === false) {
                        subscribeCheckbox.setValue(false);
                    }
                    else {
                        subscribeCheckbox.setValue(true);
                    }
                    // Make it non-clickable
                    subscribeCheckbox.disable();
                    leaveTypes.push({
                        leaveTypeId: result.leaveTypes[i].id,
                        name: result.leaveTypes[i].name,
                        subscribeCheckboxEl: subscribeCheckbox,
                        typeContainerEl: typeContainerEl
                    });

                    // Create the type's heading bar
                    lx.createElement('DIV', {
                        parent: leaveHeadingContainerEl,
                        style: {
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        },
                        innerHTML: result.leaveTypes[i].name
                    });



                    if (result.leaveTypes[i].leave.length === 0) {
                        if (result.leaveTypes[i].isSubscribed === false) {
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '15px 15px'

                                },
                                innerHTML: 'The employee does not have any leave of this type.'
                            });
                        }
                        else {
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '15px 15px'

                                },
                                innerHTML: 'The employee does not have any leave of this type for the specified period.'
                            });
                        }
                        continue;
                    }
                    let typeItemEl = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            // padding: '10px 15px'

                        },
                        // innerHTML: ruleText
                    });

                    let leaveGrid = new lx.component.Grid({
                        renderTo: typeItemEl,
                        autoSize: true,
                        borderWidth: '0px',

                        columns: [
                            { dataIndex: 'date', name: 'Date', width: '120px', padding: '0px 0px 0px 15px' },
                            { dataIndex: 'description', name: 'Description' },
                            //{dataIndex: 'source', name: 'Source', width: '120px'},
                            { dataIndex: 'unit', name: 'Amount', width: '120px', alignment: 'right' },
                            { dataIndex: 'balance', name: 'Balance', width: '120px', alignment: 'right', padding: '0px 15px 0px 0px' }
                        ]
                    });

                    let leave = [];
                    for (let j = 0; j < result.leaveTypes[i].leave.length; j++) {

                        if (result.leaveTypes[i].leave[j].date === null) {
                            continue;
                        }

                        let unit = '';
                        let unitType = '';
                        if (result.leaveTypes[i].leaveUnitCode === 'DAYS') {
                            unit = result.leaveTypes[i].leave[j].days + ' Days';
                            unitType = 'd';
                        }
                        else if (result.leaveTypes[i].leaveUnitCode === 'HOUR') {
                            unit = result.leaveTypes[i].leave[j].hours + ' Hours';
                            unitType = 'h';
                        }

                        let units = lx.util.formatLeaveUnits(unit, unitType);
                        let balance = lx.util.formatLeaveUnits(result.leaveTypes[i].leave[j].balance, unitType);
                        if (result.leaveTypes[i].leave[j].date === null) {
                            units = '';
                            balance = '';
                        }
                        leave.push({
                            description: result.leaveTypes[i].leave[j].description,
                            date: result.leaveTypes[i].leave[j].date,
                            unit: units,
                            note: ' - ',
                            balance: balance
                        });

                    }
                    leaveGrid.clear();
                    leaveGrid.addRows(leave);
                    employeeLeaveSummary.push({
                        LeaveType: result.leaveTypes[i].name,
                        leaveDetails: leave
                    })
                }
                emp.push({
                    //id : empDetails.value,
                    Name: empDetails.name,
                    Surname: empDetails.surname,
                    EmploymentDate: empDetails.employmentDate

                })
                console.log(employeeLeaveSummary);

                summaryLoaded = true;

                if (requestsLoaded) {
                    mergeRequestsIntoSummary();
                }
            }
        });
    }
    function getLeaveRequests(empDetails) {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequestList',
            data: {
                searchString: '',
                limit: null,
                offset: null,
                sortOrder: 'ASC',
                employeeId: empDetails.value,
                leaveRequestStatusCode: 'APPR',
                startDate: (startDate.getValue().trim() !== '' ? startDate.getValue().trim() : null),
                endDate: (endDate.getValue().trim() !== '' ? endDate.getValue().trim() : null),

            },
            onSuccess: function (responseText) {
                loader.hide();
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Requests Failed',
                        message: response.error
                    });
                    return;
                }

                // Populate grid
                requests = [];
                for (var i = 0; i < response.requests.length; i++) {

                    requests.push({
                        leaveTypeName: response.requests[i].leaveTypeName,
                        fromDate: response.requests[i].fromDate,
                        toDate: response.requests[i].toDate,
                        note: response.requests[i].note
                    });
                }
                console.log(requests);
                requestsLoaded = true;

                if (summaryLoaded) {
                    mergeRequestsIntoSummary();
                }
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
            innerHTML: 'Employee Leave Report'
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

        // Container for dipslaying filters
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
            margin: '0px 0px 0px 20px',
            search: true,
            onSearch: function () {
                employeeSelect.clear();
                loadEmployees(employeeSelect);
            },

            onChange: filterOnChangeEvent
        });

        // The start date for the leave to be displayed
        startDate = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            label: 'Start Date:',
            labelAlign: 'left',
            labelWidth: '70px',
            width: '210px',
            margin: '0px 0px 0px auto',

            onChange: filterOnChangeEvent
        });

        // The end date for the leave to be displayed
        endDate = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            label: 'End Date:',
            labelAlign: 'left',
            labelWidth: '65px',
            width: '210px',
            margin: '0px 0px 0px 20px',

            onChange: filterOnChangeEvent
        });
        var date = new Date();

        // Start date
        var startYear = date.getFullYear();
        var startMonth = date.getMonth();

        var startMonthStr = ('0' + (startMonth + 1)).slice(-2);

        var startDateStr = startYear + '-' + startMonthStr + '-01';

        startDate.setValue(startDateStr);

        // End date
        var endDateObj = new Date(startYear + 1, startMonth + 3, 0);

        var endYear = endDateObj.getFullYear();
        var endMonth = ('0' + (endDateObj.getMonth() + 1)).slice(-2);
        var endDay = ('0' + endDateObj.getDate()).slice(-2);

        var endDateStr = endYear + '-' + endMonth + '-' + endDay;

        endDate.setValue(endDateStr);
        //    var date = new Date();

        //     // Start date (already correct)
        //     var startYear = date.getFullYear();
        //     var startMonth = date.getMonth(); // 0-based

        //     var startDateStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
        //     startDate.setValue(startDateStr);

        //     // 👉 End date logic
        //     // Go 1 year forward, then set day = 0 of next month
        //     // (this gives last day of previous month)
        //     var endDateObj = new Date(startYear + 1, startMonth + 3, 0);

        //     var endYear = endDateObj.getFullYear();
        //     var endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
        //     var endDay = String(endDateObj.getDate()).padStart(2, '0');

        //     endDate.setValue(`${endYear}-${endMonth}-${endDay}`);

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

        // Load leave types
        loadEmployees(employeeSelect);

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

    function exportExcelBtnOnClickEventHandler() {
        if (employeeSelect.getValue() === null) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }

        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeeLeaveSummaryReport',
            target: '_self',
            data: {
                format: 'xls',
                employeeId: employeeSelect.getValue(),
                details: employeeLeaveSummary,
                employee: emp,
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
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
            url: 'exec.php?c=Report&fn=runEmployeeLeaveSummaryReport',
            target: '_self',
            data: {
                format: 'csv',
                employeeId: employeeSelect.getValue(),
                details: employeeLeaveSummary,
                employee: emp,
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
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
            url: 'exec.php?c=Report&fn=runEmployeeLeaveSummaryPdfReport',
            target: '_blank',
            data: {
                Pdfdetails: employeeLeaveSummary,
                Employee: emp,
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }

    // The event that is fire when a filter is changed
    function filterOnChangeEvent() {
        requestsLoaded = false;
        summaryLoaded = false;

        requests = [];
        employeeLeaveSummary = [];

        let value = employeeSelect.getValue();
        let selectedEmployee = employees.find(emp => emp.value == value);

        contentContainerEl.innerHTML = '';

        loadLeaveTypes(selectedEmployee);
        getLeaveRequests(selectedEmployee);
        // let value = employeeSelect.getValue();

        // let selectedEmployee = employees.find(emp => emp.value == value);

        // contentContainerEl.innerHTML = '';
        // loadLeaveTypes(selectedEmployee);
        // getLeaveRequests(selectedEmployee);
    }
    function mergeRequestsIntoSummary() {

        const normalize = (str) =>
            (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (let i = 0; i < requests.length; i++) {

            const req = requests[i];

            for (let s = 0; s < employeeLeaveSummary.length; s++) {

                const summary = employeeLeaveSummary[s];

                // match leave type
                if (normalize(summary.LeaveType) !== normalize(req.leaveTypeName)) {
                    continue;
                }

                // loop leaveDetails
                for (let d = 0; d < summary.leaveDetails.length; d++) {

                    const detail = summary.leaveDetails[d];

                    const isMatch =
                        detail.description === 'Leave Request Approved' &&
                        detail.date === req.fromDate;

                    if (isMatch) {

                        const reqNote = (req.note || '').trim();

                        if (reqNote !== '') {
                            detail.note = reqNote;
                        } else {
                            detail.note = 'None';
                        }
                    }
                }
            }
        }

        console.log('Merged summary:', employeeLeaveSummary);
    }

    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};