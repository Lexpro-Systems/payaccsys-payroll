/* globals app, lx */
'use strict';


// IMPORT EMPLOYEES PANEL
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
app.panel.ImportPayrun = function (config) {

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
    var payrunDetailsSectionEl = null;
    var departmentSelect = null;
    var descriptionTxt = null;
    var fromDate = null;
    var toDate = null;

    var wizardPage2ContainerEl = null;
    var documentUploadContainerEl = null;
    var documentNameDisplay = null;
    var browseDocumentBtnEl = null;
    var documentUploadEl = null;
    var documentLayoutGrid = null;

    var wizardPage3ContainerEl = null;
    var importResultContainerEl = null;
    var importMessageEl = null;
    var updateEmployeesRadioContainerEl = null;
    var updateEmployeesRadio = null;
    var exceptionReportHeadingEl = null;
    var exportExceptionsBtn = null;
    var exceptionsMessageEl = null;
    var exceptionDetailsContainerEl = null;
    var exceptionsGrid = null;

    var pageNum = 1;
    var documentFile = null;
    var hasCriticalExceptions = null;
    var exceptions = null;


    /*******************************
         OBJECT EXTENSIONS
    *******************************/

    lx.EventEmitter.call(this);

    /*******************************
         PRIVATE FUNCTIONS
    *******************************/

    //Retrieves and loads all of the departments from the database.
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: departmentSelect.getSearchString(),
                limit: 10,
                offset: departmentSelect.getItemCount() - 1,
                sortOrder: 'ASC'
            },
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                var departments = [];
                for (var i = 0; i < response.departments.length; i++) {

                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });

                }
                departmentSelect.addItems(departments);
            }
        });
    }

    //Function to get available default dates
    function getDefaultDates() {
        loader.show(false);

        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getDefaultDates',
            data: {
                payrunId: config.payrunId
            },
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);
                loader.hide();

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Unable to load dates',
                        message: response.error
                    });
                }

                if (response.fromDate !== null) {
                    fromDate.setValue(response.fromDate);
                    toDate.setValue(response.toDate);
                }

            }
        });
    }

    //Date control change event handler
    function dateChangeEventHandler() {
        if (fromDate.getValue() !== '' && toDate.getValue() !== '') {
            if (descriptionTxt.getValue() === '') {
                descriptionTxt.setValue(fromDate.getValue() + ' to ' + toDate.getValue());
            }
        }
    }

    /*******************************
         PUBLIC FUNCTIONS
    *******************************/

    me.init = function (config) {

        //Initialize component config
        var compConfig = {
            certificateFileId: null
        };

        //Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        //Attach external event handlers
        if (compConfig.hasOwnProperty('onCancel')) me.addEventListener('cancel', compConfig.onCancel);
        if (compConfig.hasOwnProperty('onImport')) me.addEventListener('import', compConfig.onImport);
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

        //Initialize state
        confirmDestroy = false;

        //Create root element
        el = lx.createElement('DIV', {
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


        /*******************************
                 TITLE SECTION
        *******************************/

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
            }
        });

        //Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 20px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-file-import" style="margin: 0px 15px 0px 0px;"></i>Import Payrun'
        });

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


        /***********************************
                  CONTENT SECTION
        ***********************************/

        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'hidden'
            }
        });

        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });

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

        /**********************************     
                  WIZARD SECTION
        ***********************************/

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

        // This container will contain page 1-3 and it navigation.
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

        //The page headings
        wizardHeadingEl = lx.createElement('DIV', {
            parent: wizardHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: 'auto 0px',
                padding: '10px 0px',
                fontSize: '16px'
            },
            innerHTML:
                'Import Payrun (1/3)'
        });

        lx.createElement('DIV', {
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
                backgroundColor: '#F5F6F7',
                overflow: 'auto',
            }
        });

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


        /**********************************
                  WIZARD PAGE 1
        **********************************/

        // Page 1 is where the user creates the Payrun where the data will be imported to.
        wizardPage1ContainerEl = lx.createElement('DIV', {
            parent: wizardPageContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                color: lx.style.global.color,
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
                overflow: 'auto'
            }
        });

        payrunDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 0px 0px 0px',
                padding: '15px'
            }
        });

        // This component allows the user to selecte a department.
        departmentSelect = new lx.component.Selectbox({
            renderTo: payrunDetailsSectionEl,
            labelAlignment: 'top',
            label: 'Department',
            margin: '0px 0px 0px 0px',

            search: true,

            onSearch: function () {
                departmentSelect.clear();
                departmentSelect.addItems([{ value: null, text: 'All Departments' }]);
                loadDepartments();
            },

            onListScrollEnd: function () {
                loadDepartments();
            }
        });
        departmentSelect.addItems([{ value: null, text: 'All Departments' }]);
        departmentSelect.setValue(null, 'All Departments');

        // This component allows the user to selecte a  start date range for the payrun.
        fromDate = new lx.component.DatePicker({
            renderTo: payrunDetailsSectionEl,
            label: 'From Date',
            margin: '15px 0px 0px 0px',

            onBlur: dateChangeEventHandler
        });

        // This component allows the user to selecte an end date range for the payrun.
        toDate = new lx.component.DatePicker({
            renderTo: payrunDetailsSectionEl,
            label: 'To Date',
            margin: '15px 0px 0px 0px',

            onBlur: dateChangeEventHandler
        });

        // This component allows the user to enter a description for the payrun.
        descriptionTxt = new lx.component.Textbox({
            renderTo: payrunDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Description'
        });


        /**********************************
                 WIZARD PAGE 2
        **********************************/

        // Page 2 is where the user uploads the file containing the data to be imported
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

        lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '20px 0px 7px 0px',
                width: '100%',
                fontSize: '14px'
            },
            innerHTML: 'Click on the file button to select a CSV file to import *'
        });

        documentUploadContainerEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                // display: 'none',
                boxSizing: 'border-box',
                margin: '0px 0px 0px 0px',
                padding: '0px',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start'
            }
        });

        var documentDisplayContainerEl = lx.createElement('DIV', {
            parent: documentUploadContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 10px 0px 0px',
                padding: '8px',
                width: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 1px 1px 1px',
            }
        });

        documentNameDisplay = new lx.component.Display({
            renderTo: documentDisplayContainerEl,
            flex: '1 1 auto',
            margin: '0px 0px 0px 0px'
        });
        documentNameDisplay.setValue('...');

        browseDocumentBtnEl = lx.createElement('DIV', {
            parent: documentUploadContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '36px',
                minWidth: '36px',
                height: '36px',
                minHeight: '36px',
                margin: 'auto 0px auto 0px',
                fontSize: '14px',
                color: lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-file" style="margin: auto auto;"></i>'
        });
        browseDocumentBtnEl.addEventListener('click', browseDocumentBtnElClickEventHandler);

        documentUploadEl = document.createElement('INPUT');
        documentUploadEl.type = 'file';
        documentUploadEl.accept = '.csv'; // '.csv,.xlsx';
        documentUploadEl.style.position = 'absolute';
        documentUploadEl.style.top = '-1000px';
        documentUploadEl.style.left = '-1000px';
        documentUploadEl.multiple = true;
        documentUploadEl.addEventListener('change', me.documentUploadElEventHandler);
        el.appendChild(documentUploadEl);

        let documentLayoutHeadingContainerEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '20px 0px 7px 0px',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'left',
            }
        });

        lx.createElement('DIV', {
            parent: documentLayoutHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                fontSize: '14px',
                margin: 'auto 0px'
            },
            innerHTML: 'Import format (Click the relevant button to <b>download the import template</b> in '
        });

        let downloadCsvTemplateEl = lx.createElement('DIV', {
            parent: documentLayoutHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 5px 0px 5px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'center',
                width: '50px',
                padding: '2px',
                color: lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderRadius: '15px'
            },
            innerHTML: 'CSV'
        });

        downloadCsvTemplateEl.addEventListener('click', function () {
            lx.sendForm({
                url: 'exec.php?c=Payrun&fn=downloadImportTemplate',
                data: {
                    format: 'CSVX'
                },
                target: '_self'
            });
        });

        lx.createElement('DIV', {
            parent: documentLayoutHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                fontSize: '14px',
                margin: 'auto 0px'
            },
            innerHTML: ' or '
        });

        let downloadXlsxTemplateEl = lx.createElement('DIV', {
            parent: documentLayoutHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px 5px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'center',
                width: '50px',
                padding: '2px',
                color: lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderRadius: '15px'
            },
            innerHTML: 'XLSX'
        });

        downloadXlsxTemplateEl.addEventListener('click', function () {
            new lx.component.Messagebox({
                title: 'Please note',
                message:
                    'The XLSX format makes it easy for you to enter data with dropdown lists for ' +
                    'the fields that requires list or yes/no values.<br><br>' +
                    'However, native XLSX imports are not supported and the file must be saved as ' +
                    'a CSV UTF-8 (Comma delimited) file before importing',
                buttons: [
                    { name: 'cancel', label: 'Cancel', style: 'text', isCancel: true },
                    { name: 'download', label: 'Download', isDefault: true }
                ],
                onClose: function (event) {
                    app.route.enableNavigation();
                    if (event.button === 'download') {
                        lx.sendForm({
                            url: 'exec.php?c=Payrun&fn=downloadImportTemplate',
                            data: {
                                format: 'XLSX'
                            },
                            target: '_self'
                        });
                    }
                }
            });
        });

        lx.createElement('DIV', {
            parent: documentLayoutHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                fontSize: '14px',
                margin: 'auto 0px auto 5px'
            },
            innerHTML: 'format):'
        });

        let documentLayoutGridMenuOptions = [
            { name: '<i class="fas fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view' }
        ];

        let documentLayoutGridContainerEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'auto'
            }
        });

        documentLayoutGrid = new lx.component.Grid({
            renderTo: documentLayoutGridContainerEl,
            margin: '0px 0px 0px 0px',
            height: '100%',
            flex: '1 1 100%',
            autoSize: false,
            borderWidth: '1px',

            columns: [
                { dataIndex: 'column', name: 'Column', width: '70px', padding: '0px 0px 0px 20px' },
                { dataIndex: 'fieldName', name: 'Field Name', width: '220px' },
                { dataIndex: 'compulsory', name: 'Compulsory?', width: '120px', alignment: 'center' },
                { dataIndex: 'acceptedValue', name: 'Accepted Value', width: '150px' },
                { dataIndex: 'description', name: 'Description' }, // , type: 'button'},
                { dataIndex: 'menu', name: '', type: 'menu', options: documentLayoutGridMenuOptions, width: '35px', alignment: 'center' },
                { dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px' }
            ],

            onCellClick: function (clickEvent) {

            },

            onScrollEnd: null,

            onMenuItemClick: function (clickEvent) {
                if (clickEvent.value === 'view') {
                    /* empty */
                }
            }
        });

        const fieldData = [
            { fieldName: 'Employee Number', compulsory: 'Yes', acceptedValue: '01610', description: 'The employee\'s unique employee number.' },
            { fieldName: 'Employee Name', compulsory: 'Yes', acceptedValue: 'Lungile Lungile', description: 'The employee\'s full name.' },
            { fieldName: 'ID Number', compulsory: 'Conditional', acceptedValue: '(empty)', description: 'The employee\'s ID number. Leave blank if not available.' },
            { fieldName: 'Job Title', compulsory: 'Yes', acceptedValue: 'Picker', description: 'The employee\'s job title.' },
            { fieldName: 'Department', compulsory: 'Yes', acceptedValue: 'Muzana Team', description: 'The employee\'s department.' },
            { fieldName: 'Payment Period From', compulsory: 'Yes', acceptedValue: '2026-06-15', description: 'The start date of the payment period.' },
            { fieldName: 'Payment Period To', compulsory: 'Yes', acceptedValue: '2026-06-26', description: 'The end date of the payment period.' },
            { fieldName: 'Bank Account', compulsory: 'Yes', acceptedValue: '1695700536', description: 'The employee\'s bank account number.' },
            { fieldName: 'Hourly Rate', compulsory: 'Yes', acceptedValue: '30.23', description: 'The employee\'s hourly pay rate.' },
            { fieldName: 'Basic Salary', compulsory: 'Yes', acceptedValue: '2448.9', description: 'The employee\'s basic salary.' },
            { fieldName: 'Normal Hours Worked', compulsory: 'Yes', acceptedValue: '0', description: 'The number of normal hours worked.' },
            { fieldName: 'Overtime 1.5 Hours', compulsory: 'No', acceptedValue: '0', description: 'The overtime hours worked at 1.5 times the normal rate.' },
            { fieldName: 'Overtime 2.0 Hours', compulsory: 'No', acceptedValue: '0', description: 'The overtime hours worked at double the normal rate.' },
            { fieldName: 'Paid Leave', compulsory: 'No', acceptedValue: '0', description: 'The amount paid for annual leave.' },
            { fieldName: 'Sick Leave', compulsory: 'No', acceptedValue: '0', description: 'The amount paid for sick leave.' },
            { fieldName: 'Leave Paid Out', compulsory: 'No', acceptedValue: '2050.98', description: 'The amount paid out for leave.' },
            { fieldName: 'Advance Deductions', compulsory: 'No', acceptedValue: '0', description: 'The total advance deductions.' },
            { fieldName: 'Other Deductions', compulsory: 'No', acceptedValue: '0', description: 'The total of other deductions.' },
            { fieldName: 'Equipment', compulsory: 'No', acceptedValue: '0', description: 'Equipment-related deductions.' },
            { fieldName: 'Transport', compulsory: 'No', acceptedValue: '0', description: 'Transport-related deductions.' },
            { fieldName: 'Admin Fee', compulsory: 'No', acceptedValue: '0', description: 'Administrative fees deducted.' },
            { fieldName: 'PAYE', compulsory: 'Yes', acceptedValue: '0', description: 'The employee\'s PAYE deduction.' },
            { fieldName: 'UIF Contributions', compulsory: 'Yes', acceptedValue: '45', description: 'The employee\'s UIF contribution.' },
            { fieldName: 'Total Earnings', compulsory: 'Yes', acceptedValue: '4499.88', description: 'The employee\'s total earnings.' },
            { fieldName: 'Total Deductions', compulsory: 'Yes', acceptedValue: '45', description: 'The employee\'s total deductions.' },
            { fieldName: 'Net Pay', compulsory: 'Yes', acceptedValue: '4454.88', description: 'The employee\'s net pay after all deductions.' }
        ];

        const fields = [];
        fieldData.forEach((field, index) => {
            const fieldNumber = index + 1;
            fields.push({
                fieldNumber,
                column: `<span style="font-size: 12px">${fieldNumber}</span>`,
                fieldName: `<span style="font-size: 12px">${field.fieldName}</span>`,
                compulsory: `<span style="font-size: 12px">${field.compulsory}</span>`,
                acceptedValue: `<span style="font-size: 12px">${field.acceptedValue}</span>`,
                description: `<span style="font-size: 12px">${field.description}</span>`
            });
        });

        // Add the data to the grid
        documentLayoutGrid.addRows(fields);


        //
        // WIZARD PAGE 3
        //

        wizardPage3ContainerEl = lx.createElement('DIV', {
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

        importResultContainerEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                // backgroundColor: '#F4F5F6',
                // borderStyle: 'solid',
                // borderWidth: '1px',
                // borderColor: '#DFDFDF',
                margin: '15px 0px 0px 0px',
                padding: '15px',
                // display: 'none'
            }
        });

        importMessageEl = lx.createElement('DIV', {
            parent: importResultContainerEl,
            style: {
                // fontSize: '12px'
            }
        });

        updateEmployeesRadioContainerEl = lx.createElement('DIV', {
            parent: importResultContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                display: 'none',
            }
        });

        updateEmployeesRadio = new lx.component.RadioGroup({
            renderTo: updateEmployeesRadioContainerEl,
            label: '', // 'Do you wish to ignore or update the existing Employees?',
            maxWidth: '300px',
            items: [
                { text: 'Ignore', value: false },
                { text: 'Update', value: true }
            ]
        });
        updateEmployeesRadio.setValue(false);

        exceptionsMessageEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                // color: lx.style.global.backgroundColor,
                // backgroundColor: '#30313C', // '#24388E', '#3B81EB',
                backgroundColor: '#F4F5F6',
                // borderStyle: 'solid',
                // borderWidth: '1px',
                // borderColor: '#DFDFDF',
                fontSize: '12px',
                margin: '15px 0px 0px 0px',
                padding: '15px',
                // display: 'none'
            }
        });

        exceptionDetailsContainerEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'auto'
            }
        });

        exceptionReportHeadingEl = lx.createElement('DIV', {
            parent: exceptionDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '50px',
                padding: '15px 0px 0px 0px',
                fontSize: '16px'
            },
            innerHTML: '<div>Exceptions</div>'
        });

        exportExceptionsBtn = new lx.component.Button({
            renderTo: exceptionReportHeadingEl,
            label: 'Export ',
            style: 'text',

            onClick: exportExceptionsBtnClickEventHandler
        });

        let exceptionsGridContainerEl = lx.createElement('DIV', {
            parent: exceptionDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                display: 'flex',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'auto'
            }
        });

        exceptionsGrid = new lx.component.Grid({
            renderTo: exceptionsGridContainerEl,
            height: '100%',
            flex: '1 1 100%',
            autoSize: false,
            borderWidth: '1px',

            columns: [
                { dataIndex: 'select', width: '50px', type: 'rowSelect' },
                { dataIndex: 'statusIcon', name: '', width: '40px' },
                { dataIndex: 'description', name: 'Description' },
                { dataIndex: 'value', name: 'Value' },
                { dataIndex: 'rowNumber', name: 'Row', width: '60px', alignment: 'right' },
                { dataIndex: 'columnNumber', name: 'Column', width: '60px', alignment: 'right' },
                { dataIndex: 'showMore', name: '', width: '120px', type: 'button', alignment: 'right' },
            ],

            onCellClick: function (event) {
                // Depending on the column clicked
                if (event.srcComponent.getColumnDataIndex(event.columnIndex) === 'showMore') {
                    // Display additional details about the exception
                    new lx.component.Messagebox({
                        title: 'Exception Details',
                        message: exceptionsGrid.getRow(event.rowIndex).fullDescription
                    });
                }
            },
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

        loadDepartments();
        getDefaultDates();
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function () {
        // Check if we need to confirm before destroying the panel.
        if (confirmDestroy === true) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    { name: 'cancel', label: 'Cancel', style: 'text', isCancel: true },
                    { name: 'continue', label: 'Continue', isDefault: true }
                ],
                onClose: function (event) {
                    app.route.enableNavigation();
                    if (event.button === 'continue') {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });

            return false;
        }

        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if (destroyResult === false) return false;

        // me.panelDestroy();
        return true;
    };

    // Function to set focus to the panel.
    me.focus = function () {
    };


    //
    // EVENT HANDLERS
    //

    // wizardCancelBtn click event handler
    function wizardCancelBtnClickEventHandler() {
        // Fire the cancel event
        // console.log("cancel event has been triggered")
        me.fireEvent('cancel', { srcPanel: me });
    }

    // wizardPreviousBtn click event handler
    function wizardPreviousBtnClickEventHandler() {
        wizardSectionEl.scrollTop = 0;

        // Depending on the page we're on
        if (pageNum === 1) {
            // Can't go back
        }
        else if (pageNum === 2) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Import Payrun (' + pageNum + '/3)';

            // Display the previous page
            wizardPage1ContainerEl.style.display = 'flex';
            wizardPage2ContainerEl.style.display = 'none';

            // Disable the previous button
            wizardPreviousBtn.disable();
        }
        else if (pageNum === 3) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Import Details (' + pageNum + '/3)';

            // Display the previous page
            wizardPage2ContainerEl.style.display = 'flex';
            wizardPage3ContainerEl.style.display = 'none';

            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
        }
    }

    // wizardNextBtn click event handler
    function wizardNextBtnClickEventHandler() {
        wizardSectionEl.scrollTop = 0;

        // Depending on the page we're on
        if (pageNum === 1) {
            // Check that a from date was entered.
            if (fromDate.getValue() === '') {
                wizardNextBtn.showWarning('Please enter from date.');
                return;
            }

            // Check that the from date entered is valid
            if (fromDate.isValid() === false) {
                wizardNextBtn.showWarning('Please enter a valid from date.');
                return;
            }

            // Check that a to date was entered
            if (toDate.getValue() === '') {
                wizardNextBtn.showWarning('Please enter a to date.');
                return;
            }

            // Check that the to date entered is valid
            if (toDate.isValid() === false) {
                wizardNextBtn.showWarning('Please enter a valid to date.');
                return;
            }

            // Check that a description was entered.
            if (descriptionTxt.getValue() === '') {
                wizardNextBtn.showWarning('Please enter a description for the payrun.');
                return;
            }

            // Update the page number and heading
            pageNum++;
            wizardHeadingEl.innerHTML = 'Import Details (' + pageNum + '/3)';

            // Display the next page
            wizardPage1ContainerEl.style.display = 'none';
            wizardPage2ContainerEl.style.display = 'flex';

            // Enable the previous button
            wizardPreviousBtn.enable();
        }
        else if (pageNum === 2) {
            if (documentFile === null) {
                wizardNextBtn.showWarning(
                    'No import file specified. Please click on the file button to select a file to import.'
                );
                return;
            }

            wizardNextBtn.showLoader();
            wizardNextBtn.disable();

            // Set a timeout for the file upload in case the user edited the file after it was selected
            const fileUploadTimeout = setTimeout(function () {
                new lx.component.Messagebox({
                    title: 'The process is taking a long time',
                    message:
                        'Certain browsers will not allow you to upload a file if it was edited after it had been selected.<br><br>' +
                        'Please select \'Retry\', re-select the import file, and click the \'Next\' button to try again or select the ' +
                        '\'Continue\' option if you are importing a particularly large file.',
                    buttons: [
                        { name: 'continue', label: 'Continue', style: 'text', isCancel: true },
                        { name: 'retry', label: 'Retry', isDefault: true }
                    ],
                    onClose: function (event) {
                        if (event.button === 'retry') {
                            // Enable the next button
                            wizardNextBtn.hideLoader();
                            wizardNextBtn.enable();
                        }
                    }
                });
            },
                20000
            );

            // Get execptions, if any
            lx.sendJSON({
                url: 'exec.php?c=Payrun&fn=getImportExceptionList',
                data: {
                    departmentId: departmentSelect.getValue(),
                    startDate: fromDate.getValue(),
                    endDate: toDate.getValue(),
                    description: descriptionTxt.getValue()
                },
                files: [
                    { name: 'document', file: documentFile, fileName: documentFile.fileName }
                ],
                onSuccess: function (responseText) {
                    // Clear the file upload timeout
                    clearTimeout(fileUploadTimeout);

                    let response = JSON.parse(responseText);

                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();

                    if (response.ok !== true) {
                        new lx.component.Messagebox({
                            title: 'Getting Exceptions Failed',
                            message: response.error
                        });
                        return;
                    }

                    // Are there existing employees in the import file?
                    if (response.updateCount > 0) {
                        importMessageEl.innerHTML = 'A total of <b>' + response.importCount + '</b> new employees and <b>' + response.updateCount + '</b> existing employees were found. Do you wish to ignore or update the existing employees?';
                        updateEmployeesRadioContainerEl.style.display = 'block';
                    }
                    else {
                        importMessageEl.innerHTML = 'A total of <b>' + response.importCount + '</b> new employees and <b>' + response.updateCount + '</b> existing employees were found.';
                        updateEmployeesRadioContainerEl.style.display = 'none';
                    }

                    // Are there no exeptions?
                    if (response.exceptions.length <= 0) {
                        exceptionsMessageEl.innerHTML = '<div style="font-size: 14px;">No exceptions found. Click the \'Finish\' button to import the payrun.</div>';
                        exceptionDetailsContainerEl.style.display = 'none';
                    }
                    else {
                        exceptionsMessageEl.innerHTML =
                            '<div style="font-size: 12px;">' +
                            'Exceptions were found. Please check each warning (indicated by the ' +
                            '<i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i> ' +
                            'icon) to verify that you are aware of them (you can check or uncheck all the exceptions ' +
                            'at once by clicking on the check mark in the heading of the check column).<br><br>' +
                            'IMPORTANT: You will not be able to import the payrun if ' +
                            'there are any critical exceptions (indicated by the ' +
                            '<i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i> ' +
                            'icon).' +
                            '</div>';
                        exceptionDetailsContainerEl.style.display = 'flex';
                    }

                    exceptions = response.exceptions;

                    let rows = [];
                    hasCriticalExceptions = false;
                    for (var i = 0; i < response.exceptions.length; i++) {
                        var statusIcon = '<i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i>';
                        if (response.exceptions[i].isCritical) {
                            statusIcon = '<i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i>';
                            hasCriticalExceptions = true;
                        }

                        rows.push({
                            statusIcon: statusIcon,
                            isCritical: '<span style="font-size: 12px">' + response.exceptions[i].isCritical + '</span>',
                            columnNumber: '<span style="font-size: 12px">' + (response.exceptions[i].column === null ? '-' : response.exceptions[i].column) + '</span>',
                            rowNumber: '<span style="font-size: 12px">' + (response.exceptions[i].row === null ? '-' : response.exceptions[i].row) + '</span>',
                            value: '<span style="font-size: 12px">' + response.exceptions[i].value + '</span>',
                            description: '<span style="font-size: 12px">' + response.exceptions[i].description + '</span>',
                            fullDescription: '<span style="font-size: 12px">' + response.exceptions[i].fullDescription + '</span>',
                            showMore: '<span style="font-size: 12px">More details...</span>'
                        });
                    }

                    // Clear the grid and add the exceptions
                    exceptionsGrid.clear();
                    exceptionsGrid.addRows(rows);

                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Exception Report (' + pageNum + '/3)';

                    // Display the next page
                    wizardPage2ContainerEl.style.display = 'none';
                    wizardPage3ContainerEl.style.display = 'flex';

                    // Enable the previous button
                    wizardPreviousBtn.enable();

                    // Change the label of the next button
                    wizardNextBtn.setLabel('Finish');
                }
            });

        }
        else if (pageNum === 3) {
            // Are there critical exceptions?
            if (hasCriticalExceptions) {
                wizardNextBtn.showWarning(
                    'Unable to import payrun. Critical exceptions found.'
                );
                return;
            }

            // Are there critical exceptions?
            if (exceptionsGrid.getSelectedRowCount() !== exceptionsGrid.getRowCount()) {
                wizardNextBtn.showWarning(
                    'Unable to import payrun. One or more exceptions have not been checked.'
                );
                return;
            }

            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            wizardPreviousBtn.disable();

            // Set a timeout for the file upload in case the user edited the file after it was selected
            const fileUploadTimeout = setTimeout(function () {
                new lx.component.Messagebox({
                    title: 'The process is taking a long time',
                    message:
                        'Certain browsers will not allow you to upload a file if it was edited after it had been selected.<br><br>' +
                        'Please select \'Retry\', re-select the import file, and click the \'Next\' button to try again or select the ' +
                        '\'Continue\' option if you are importing a particularly large file.',
                    buttons: [
                        { name: 'continue', label: 'Continue', style: 'text', isCancel: true },
                        { name: 'retry', label: 'Retry', isDefault: true }
                    ],
                    onClose: function (event) {
                        if (event.button === 'retry') {
                            // Enable the next button
                            wizardNextBtn.hideLoader();
                            wizardNextBtn.enable();
                            wizardPreviousBtn.enable();
                        }
                    }
                });
            },
                20000
            );

            // Get execptions, if any
            lx.sendJSON({
                url: 'exec.php?c=Payrun&fn=import',
                data: {
                    updateEmployees: updateEmployeesRadio.getValue(),
                    departmentId: departmentSelect.getValue(),
                    startDate: fromDate.getValue(),
                    endDate: toDate.getValue(),
                    description: descriptionTxt.getValue()
                },
                files: [
                    { name: 'document', file: documentFile, fileName: documentFile.fileName }
                ],
                onSuccess: function (responseText) {
                    // Clear the file upload timeout
                    clearTimeout(fileUploadTimeout);

                    let response = JSON.parse(responseText);

                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    wizardPreviousBtn.enable();

                    if (response.ok !== true) {
                        new lx.component.Messagebox({
                            title: 'Importing Payrun Failed',
                            message: response.error
                        });
                        return;
                    }

                    // console.log(" finish event should be fired");

                    // Fire the finish event
                    // me.fireEvent('finish', {srcPanel: me});
                    me.fireEvent('import', { srcPanel: me });
                }
            });
        }
    }

    // exportExceptionsBtn click event handler
    function exportExceptionsBtnClickEventHandler() {
        // Open the modal window to export employees
        let exportExceptionsModal = new app.panel.ExportExceptions({
            // renderTo: app.mainPanel.getContainer(),
            renderTo: exceptionReportHeadingEl,
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '234px',

            exceptions: exceptions,

            onClose: function () {
                app.route.popState();
            }
        });

        let panelState = {
            previousPanel: me,
            panel: exportExceptionsModal
        };

        app.route.pushState(panelState, function (state) {
            if (!state.panel.destroy()) return false;
            state.previousPanel.show();
        });

        exportExceptionsModal.showModal();
        exportExceptionsModal.focus();
    }

    // Document upload element event handler
    me.documentUploadElEventHandler = function () {
        let showError = false;
        let fileList = '';
        let errorMessage = '';

        let allowedExtenstions = ['csv']; // ['csv','xlsx'];

        if (documentUploadEl.files.length < 1) {
            return;
        }

        documentNameDisplay.setValue('');
        documentFile = null;

        if (documentUploadEl.files.length > 1) {
            errorMessage = 'Multiple files were selected but only a single file may be imported at a time.';
            showError = true;
        }

        if (!showError) {
            errorMessage = 'The following files failed to upload: </br>';

            for (var i = 0; i < documentUploadEl.files.length; i++) {
                // Was a valid file received?
                if (typeof documentUploadEl.files[i] != "undefined") {

                    let fileExtenstion = documentUploadEl.files[i].name.split('.').pop();

                    // Is the file larger than the limit?
                    var fileSize = documentUploadEl.files[i].size / 1024 / 1024;
                    if (fileSize > 50) {
                        fileList = fileList + '</br>' + documentUploadEl.files[i].name + ' exceeds the 50mb limit.';
                        showError = true;
                        continue;
                    }

                    // Is the file extenstion correct
                    let invalidFile = true;
                    for (var x = 0; x < allowedExtenstions.length; x++) {
                        if (allowedExtenstions[x] === fileExtenstion.toLowerCase()) {
                            invalidFile = false;
                            break;
                        }
                    }

                    if (invalidFile) {
                        fileList = fileList + '</br>' + documentUploadEl.files[i].name + ' has an invalid file extension of ' + fileExtenstion + '.';
                        showError = true;
                        continue;
                    }

                    // Set the document file name and the document file
                    documentNameDisplay.setValue(documentUploadEl.files[i].name);
                    documentFile = documentUploadEl.files[i];

                    // Use the  upload manager to upload the file in the background
                    // app.uploadManager.queueUpload('exec.php?c=Document&fn=uploadDocument', {companyId: 1}, documentUploadEl.files[i]);
                }
            }
        }

        // Checks if a file was invalid
        if (showError) {
            new lx.component.Messagebox({
                title: 'Unable to import file',
                message: errorMessage + fileList,
                icon: 'icon_error',

                buttons: [
                    { name: 'ok', label: 'Ok' }
                ]
            });
        }
    };

    // Browse document button click event handler
    function browseDocumentBtnElClickEventHandler() {
        documentUploadEl.value = null;

        // Simulate a click event on the document upload element
        if (documentUploadEl.click) {
            documentUploadEl.click();
        }
        else if (documentUploadEl.dispatchEvent) {
            documentUploadEl.dispatchEvent(new Event('click'));
        }
    }


    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};