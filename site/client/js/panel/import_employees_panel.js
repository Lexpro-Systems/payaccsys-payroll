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
app.panel.ImportEmployees = function(config) {
    
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
    var documentUploadContainerEl = null;
    var documentNameDisplay = null;
    var browseDocumentBtnEl = null;
    var documentUploadEl = null;
    var documentLayoutGrid = null;
    
    var wizardPage2ContainerEl = null;
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
    
    
    //
    // OBJECT EXTENSIONS
    //
    lx.EventEmitter.call(this);
    // lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
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
        if( compConfig.hasOwnProperty('onImport') ) me.addEventListener('import', compConfig.onImport);
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
            innerHTML: '<i class="fa fa-fw fa-file-import" style="margin: 0px 15px 0px 0px;"></i>Import Employees'
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
                'Import Details (1/2)'
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
        
        lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '20px 0px 7px 0px',
                width: '100%',
                fontSize: '14px'
            },
            innerHTML: 'Click on the file button to select a CSV file to import *'
        });
        
        documentUploadContainerEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
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
        // documentNameDisplay.disable();
        
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
                color:  lx.style.global.backgroundColor,
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
        el.appendChild( documentUploadEl );
        
        let documentLayoutHeadingContainerEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
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
                color:  lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderRadius: '15px'
            },
            innerHTML: 'CSV'
        });
        downloadCsvTemplateEl.addEventListener('click', function() {
            lx.sendForm({
                url: 'exec.php?c=Employee&fn=downloadImportTemplate',
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
                color:  lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderRadius: '15px'
            },
            innerHTML: 'XLSX'
        });
        downloadXlsxTemplateEl.addEventListener('click', function() {
            new lx.component.Messagebox({
                title: 'Please note',
                message: 
                    'The XLSX format makes it easy for you to enter data with dropdown lists for ' +
                    'the fields that requires list or yes/no values.<br><br>' +
                    'However, native XLSX imports are not supported and the file must be saved as ' +
                    'a CSV UTF-8 (Comma delimited) file before importing',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'download', label: 'Download', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'download' ) {
                        lx.sendForm({
                            url: 'exec.php?c=Employee&fn=downloadImportTemplate',
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
            {name: '<i class="fas fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'}
        ];
        
        let documentLayoutGridContainerEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
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
                {dataIndex: 'column', name: 'Column', width: '70px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'fieldName', name: 'Field Name', width: '220px'},
                {dataIndex: 'compulsory', name: 'Compulsory?', width: '120px', alignment: 'center'},
                {dataIndex: 'acceptedValue', name: 'Accepted Value', width: '150px'},
                {dataIndex: 'description', name: 'Description'}, // , type: 'button'},
                {dataIndex: 'menu', name: '', type: 'menu', options: documentLayoutGridMenuOptions, width: '35px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: function( clickEvent ) {
                // Depending on the column clicked
                if( documentLayoutGrid.getColumnDataIndex(clickEvent.columnIndex) === 'acceptedValue' ) {
                    // Get the filed name
                    let fieldNumber = documentLayoutGrid.getRow(clickEvent.rowIndex).fieldNumber;

                    if( fieldNumber === 2) {
                        new lx.component.Messagebox({
                            title: 'Title List',
                            message: 
                                '<span style="font-size: 14px">Please specify one of the following values:' + 
                                    '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' + 
                                        '<li>Adv</li>' +
                                        '<li>Dr</li>' +
                                        '<li>Miss</li>' +
                                        '<li>Mr</li>' +
                                        '<li>Mrs</li>' +
                                        '<li>Ms</li>' +
                                        '<li>Prof</li>' +
                                    '</ul>' +
                                '</span>'
                        });
                    }
                    
                    if( fieldNumber === 9 ||  fieldNumber === 20 || fieldNumber === 26 || fieldNumber === 34) {
                        new lx.component.Messagebox({
                            title: 'Country List',
                            message: 
                                    '<span style="font-size: 14px">Please specify one of the following countries:' + 
                                        '<div style="max-height: 200px; overflow-y: auto;">' +
                                            '<ul style="padding: 0px 0px 0px 20px; font-size: 14px">' +
                                                '<li>Angola</li>' +
                                                '<li>Bangladesh</li>' +
                                                '<li>Belgium</li>' +
                                                '<li>Botswana</li>' +
                                                '<li>Burundi</li>' +
                                                '<li>Canada</li>' +
                                                '<li>Cape Verde</li>' +
                                                '<li>China</li>' +
                                                '<li>Congo</li>' +
                                                '<li>Ethiopia</li>' +
                                                '<li>France</li>' +
                                                '<li>Germany</li>' +
                                                '<li>Ghana</li>' +
                                                '<li>Malawi</li>' +
                                                '<li>Mauritius</li>' +
                                                '<li>Mozambique</li>' +
                                                '<li>Namibia</li>' +
                                                '<li>Netherlands</li>' +
                                                '<li>Nigeria</li>' +
                                                '<li>Pakistan</li>' +
                                                '<li>Poland</li>' +
                                                '<li>Somalia</li>' +
                                                '<li>South Africa</li>' +
                                                '<li>United Kingdom</li>' +
                                                '<li>United States</li>' +
                                                '<li>Zambia</li>' +
                                                '<li>Zimbabwe</li>' +
                                                '<li>India</li>' +
                                                '<li>Ireland</li>' +
                                                '<li>Italy</li>' +
                                                '<li>Japan</li>' +
                                                '<li>Kenya</li>' +
                                                '<li>Lesotho</li>' +
                                            '</ul>' +
                                        '</div>' +
                                    '</span>'
                        });      
                    }
                    else if(fieldNumber === 47){
                        new lx.component.Messagebox({
                            title: 'Payment Method List',
                            message: 
                                '<span style="font-size: 14px">Please specify one of the following values:' + 
                                    '<div style="max-height: 200px; overflow-y: auto;">' +
                                        '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                            '<li>Cash</li>' +
                                            '<li>Cheque</li>' +
                                            '<li>EFT</li>' +
                                        '</ul>' +
                                    '</div>' + 
                                '</span>'
                        });
                    }
                    else if(fieldNumber === 48){
                        new lx.component.Messagebox({
                            title: 'Payment Period List',
                            message: 
                                '<span style="font-size: 14px">Please specify one of the following values:' + 
                                    '<div style="max-height: 200px; overflow-y: auto;">' +
                                        '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                            '<li>Monthly</li>' +
                                            '<li>Weekly</li>' +
                                            '<li>Every Two Weeks</li>' +
                                        '</ul>' +
                                    '</div>' + 
                                '</span>'
                        });
                    }  
                    else if( fieldNumber === 49 || fieldNumber === 50) {
                        new lx.component.Messagebox({
                            title: 'Payment Period Day List',
                            message: 
                                '<span style="font-size: 14px">If the payment period is &apos;Monthly&apos;, please specify the day of the month (1 to 28) or "Last Day"' + 
                                    '<div style="max-height: 150px; overflow-y: auto;">' +
                                        '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                            '<li>1</li>' +
                                            '<li>2</li>' +
                                            '<li>3</li>' +
                                            '<li>4</li>' +
                                            '<li>5</li>' +
                                            '<li>6</li>' +
                                            '<li>7</li>' +
                                            '<li>8</li>' +
                                            '<li>9</li>' +
                                            '<li>10</li>' +
                                            '<li>11</li>' +
                                            '<li>12</li>' +
                                            '<li>13</li>' +
                                            '<li>14</li>' +
                                            '<li>15</li>' +
                                            '<li>16</li>' +
                                            '<li>17</li>' +
                                            '<li>18</li>' +
                                            '<li>19</li>' +
                                            '<li>20</li>' +
                                            '<li>21</li>' +
                                            '<li>22</li>' +
                                            '<li>23</li>' +
                                            '<li>24</li>' +
                                            '<li>25</li>' +
                                            '<li>26</li>' +
                                            '<li>27</li>' +
                                            '<li>28</li>' +
                                            '<li>Last Day</li>' +
                                        '</ul>' +
                                    '</div>' + 
                                '</span><br>' +
                                '<span style="font-size: 14px">If the payment period is &apos;Weekly&apos;, please specify the day of the week:' + 
                                    '<div style="max-height: 200px; overflow-y: auto;">' +
                                        '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                            '<li>Monday</li>' +
                                            '<li>Tuesday</li>' +
                                            '<li>Wednesday</li>' +
                                            '<li>Thursday</li>' +
                                            '<li>Friday</li>' +
                                            '<li>Saturday</li>' +
                                            '<li>Sunday</li>' +
                                        '</ul>' +
                                    '</div>' + 
                                '</span>' +
                                '<span style="font-size: 14px">If the payment period is &apos;Every Two Weeks&apos;, please specify the week and day of the week:' + 
                                    '<div style="max-height: 200px; overflow-y: auto;">' +
                                        '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                            '<li>Monday</li>' +
                                            '<li>Tuesday</li>' +
                                            '<li>Wednesday</li>' +
                                            '<li>Thursday</li>' +
                                            '<li>Friday</li>' +
                                            '<li>Saturday</li>' +
                                            '<li>Sunday</li>' +
                                            // '<li>Week 1: Monday</li>' +
                                            // '<li>Week 1: Tuesday</li>' +
                                            // '<li>Week 1: Wednesday</li>' +
                                            // '<li>Week 1: Thursday</li>' +
                                            // '<li>Week 1: Friday</li>' +
                                            // '<li>Week 1: Saturday</li>' +
                                            // '<li>Week 1: Sunday</li>' +
                                            // '<li>Week 2: Monday</li>' +
                                            // '<li>Week 2: Tuesday</li>' +
                                            // '<li>Week 2: Wednesday</li>' +
                                            // '<li>Week 2: Thursday</li>' +
                                            // '<li>Week 2: Friday</li>' +
                                            // '<li>Week 2: Saturday</li>' +
                                            // '<li>Week 2: Sunday</li>' +
                                        '</ul>' +
                                    '</div>' + 
                                '</span>'
                        });
                    }
                    else if( fieldNumber === 51) {
                        // Send the request to get the financial institution data
                        lx.sendJSON({
                            url: 'exec.php?c=FinancialInstitution&fn=getList',
                            data: {
                                searchString: '',
                                limit: null,
                                offset: 0,
                                sortOrder: 'ASC'
                            },
                            onSuccess: function( responseText ) {
                                loader.hide();
                                var response = JSON.parse(responseText);
                                
                                // Was the request not successful?
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Loading Financial Institutions Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                // Add the institutions to a list
                                let financialInstitutionList = '';
                                for( var i = 0; i < response.institutions.length; i++ ) {
                                    financialInstitutionList = financialInstitutionList +
                                        '<li>' + 
                                            response.institutions[i].name +
                                        '</li>';
                                }
                                
                                // Display the message
                                new lx.component.Messagebox({
                                    title: 'Financial Institution List',
                                    message: 
                                        '<span style="font-size: 14px">Please specify one of the following standard industrial classification codes:' + 
                                            '<div style="margin: 10px 0px 0px 0px; max-height: 200px; overflow-y: auto;">' +
                                                '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                                    financialInstitutionList +
                                                '</ul>' +
                                            '</div>' +
                                        '</span>'
                                });
                            }
                        });
                    }
                    else if( fieldNumber === 52) {
                        new lx.component.Messagebox({
                            title: 'Bank Account Type List',
                            message: 
                                '<span style="font-size: 14px">Please specify one of the following values:' + 
                                    '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                        '<li>Cheque</li>' +
                                        '<li>Savings</li>' +
                                    '</ul>' +
                                '</span>'
                        });
                    }
                    else if( fieldNumber === 56) {
                        // Send the request to get the SIC code data
                        lx.sendJSON({
                            url: 'exec.php?c=Types&fn=getSicCodeList',
                            data: {
                                searchString: '',
                                limit: null,
                                offset: 0,
                                sortOrder: 'ASC'
                            },
                            onSuccess: function( responseText ) {
                                loader.hide();
                                var response = JSON.parse(responseText);
                                
                                // Was the request not successful?
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Loading SIC Codes Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                // Add the SIC codes to a list
                                let sicCodesList = '';
                                for( var i = 0; i < response.sicCodes.length; i++ ) {
                                    sicCodesList = sicCodesList +
                                        '<li>' + 
                                            response.sicCodes[i].code +
                                        '</li>';
                                }
                                
                                // Display the message
                                new lx.component.Messagebox({
                                    title: 'SIC Codes List',
                                    message: 
                                        '<span style="font-size: 14px">Please specify one of the following standard industrial classification codes:' + 
                                            '<div style="margin: 10px 0px 0px 0px; max-height: 200px; overflow-y: auto;">' +
                                                '<ul style="padding: 0px 0px 0px 20px; font-size: 14px;">' +
                                                    sicCodesList +
                                                '</ul>' +
                                            '</div>' +
                                        '</span>'
                                });
                            }
                        });
                    }
                }
            },
            
            onScrollEnd: null,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'view' ) { 
                    /* empty */ 
                }
            }
        });
        
        let fields = [];
        let fieldNumber = 0;
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Number</span>',
            description: '<span style="font-size: 12px">The employee\'s code. Automatically generated by the <br>system if not provided</span>',
            // menu: '<i class="fa fa-ellipsis-v"></i>',
            // spacer: ''
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Title</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s title</span>',
            // menu: '<i class="fa fa-ellipsis-v"></i>',
            // spacer: ''
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Initials</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s initials</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Full Names</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s full names</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Last Name</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s last name</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Alias</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s nickname</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">ID Number</span>',
            compulsory: '<span style="font-size: 12px">Conditional</span>',
            acceptedValue: '<span style="font-size: 12px">Numeric</span>',
            description: '<span style="font-size: 12px">The employee\'s ID number. Required if no passport number <br>is specified. Format: #############</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Passport Number</span>',
            compulsory: '<span style="font-size: 12px">Conditional</span>',
            acceptedValue: '<span style="font-size: 12px">Alphanumeric value</span>',
            description: '<span style="font-size: 12px">The employee\'s passport number. Required if no id number <br>is specified</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Passport Country</span>',
            compulsory: '<span style="font-size: 12px">Conditional</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s passport country. Required when passport <br>number is specified</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Date of Birth</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The employee\'s date of birth</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Is Asylum Seeker</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Is the employee an asylum seeker?</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Is Refugee</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Is the employee a refugee?</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Is Retired</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Is the employee retired?</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Unit</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address unit</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Complex</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address complex</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Street</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address street</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Suburb</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address details</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address City</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address city</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Postal Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address postal code</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Physical Address Country</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s physical address country</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Same As Physical Address</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Whether the postal and physical address\'s are the same</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Address Line 1</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s postal address details line 1</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Address Line 2</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s postal address details line 2</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Address Line 3</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s postal address details line 3</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Address Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s postal address code</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Postal Address Country</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s postal address country</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Same As Company Address</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Whether the work and company address\'s are the same<br> company address</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Unit</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address unit</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Complex</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address complex</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Street</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address street</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Suburb</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address suburb</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address City</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address city</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Postal Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work address postal code</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Address Country</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s work address country</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Home Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s home phone number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Work Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s work phone number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Cell Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s cell phone number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Fax Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s fax number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Email Address</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any valid email address</span>',
            description: '<span style="font-size: 12px">The employee\'s email address</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Emergency Contact Person</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s emergency contact person</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Emergency Contact Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s emergency contact number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Employment Start Date</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The the date on which the employee was employed</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Employment End Date</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The the date on which employment was terminated</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Employment Position</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee\'s position</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Employment Status</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">None</span>',
            description: '<span style="font-size: 12px">The employment status will be determined by the system <br>and should be left empty</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Department Name</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The employee&apos;s department. The department will be added <br>if it doesn&apos;t exist already</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Payment Method</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The payment method for the employee</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Payment Period</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The payment period for the employee</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Payment Day</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">Day on which employee recieves payment</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Payment Period End Day</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The last day of the billing/work cycle for the employee <br>(i.e., the day on which the payslip ends)</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Financial Institution</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">Financial institution where account holder is registered</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Bank Account Type</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">Type of bank account</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Account Number</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any alphanumeric value</span>',
            description: '<span style="font-size: 12px">Bank account number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Branch Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any alphanumeric value</span>',
            description: '<span style="font-size: 12px">Branch code for bank account</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Number</span>',
            compulsory: '<span style="font-size: 12px">Recommended</span>',
            acceptedValue: '<span style="font-size: 12px">A valid income tax number</span>',
            description: '<span style="font-size: 12px">The employee\'s income tax number</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">SIC Code</span>',
            compulsory: '<span style="font-size: 12px">Conditional</span>',
            acceptedValue: '<span style="font-size: 12px; color: ' + lx.style.global.highlightColor + '; cursor: pointer;">List (click for details)</span>',
            description: '<span style="font-size: 12px">The employee\'s standard industrial classification code. <br>Required if the company SIC code hasn&apos;t been completed</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Send Payslip By Email</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Should payslips be emailed to employee</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 1</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The first income tax directive for the employee</span>',
        });
               
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 1 Issued Date</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The date on which the first income tax directive was issued</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 1 Source Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The source code for the first income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 1 Amount</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Amount</span>',
            description: '<span style="font-size: 12px">The amount for the first income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 2</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The second income tax directive for the employee</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 2 Issued Date</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The date on which the second income tax directive was <br>issued</span>',
        });
       
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 2 Source Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The source code for the second income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 2 Amount</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Amount</span>',
            description: '<span style="font-size: 12px">The amount for the second income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 3</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The third income tax directive for the employee</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 3 Issued Date</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Date [CCYY-MM-DD]</span>',
            description: '<span style="font-size: 12px">The date on which the third income tax directive was issued</span>',
        });
       
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 3 Source Code</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Any text value</span>',
            description: '<span style="font-size: 12px">The source code for the third income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Income Tax Directive 3 Amount</span>',
            compulsory: '<span style="font-size: 12px">No</span>',
            acceptedValue: '<span style="font-size: 12px">Amount</span>',
            description: '<span style="font-size: 12px">The amount for the third income tax directive</span>',
        });
        
        fields.push({
            fieldNumber: (++fieldNumber),
            column: '<span style="font-size: 12px">' + fieldNumber + '</span>',
            fieldName: '<span style="font-size: 12px">Enable Paye Correction</span>',
            compulsory: '<span style="font-size: 12px">Yes</span>',
            acceptedValue: '<span style="font-size: 12px">Yes or No</span>',
            description: '<span style="font-size: 12px">Whether to enable PAYE corrections or not</span>',
        });

        // Add the data to the grid
        documentLayoutGrid.addRows( fields );
        
        
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
        
        importResultContainerEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
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
                {text: 'Ignore', value: false},
                {text: 'Update', value: true}
            ]
        });
        updateEmployeesRadio.setValue(false);
        
        exceptionsMessageEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
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
            parent: wizardPage2ContainerEl,
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
                {dataIndex: 'select', width: '50px', type: 'rowSelect'},
                {dataIndex: 'statusIcon', name: '', width: '40px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'value', name: 'Value'},
                {dataIndex: 'rowNumber', name: 'Row', width: '60px', alignment: 'right'},
                {dataIndex: 'columnNumber', name: 'Column', width: '60px', alignment: 'right'},
                {dataIndex: 'showMore', name: '', width: '120px', type: 'button', alignment: 'right'},
            ],
            
            onCellClick:  function( event ) {
                    // Depending on the column clicked
                    if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'showMore' ) {
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
    };
    
    
    //
    // EVENT HANDLERS
    //
    
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
            wizardHeadingEl.innerHTML = 'Import Details (' + pageNum + '/2)';
            
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
            if( documentFile === null ) {
                wizardNextBtn.showWarning(
                    'No import file specified. Please click on the file button to select a file to import.'
                );
                return;
            }
            
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            
            // Set a timeout for the file upload in case the user edited the file after it was selected
            const fileUploadTimeout = setTimeout(function() {
                    new lx.component.Messagebox({
                        title: 'The process is taking a long time',
                        message: 
                            'Certain browsers will not allow you to upload a file if it was edited after it had been selected.<br><br>' +
                            'Please select \'Retry\', re-select the import file, and click the \'Next\' button to try again or select the ' + 
                            '\'Continue\' option if you are importing a particularly large file.',
                        buttons: [
                            {name: 'continue', label: 'Continue', style: 'text', isCancel: true},
                            {name: 'retry', label: 'Retry', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'retry' ) {
                                // Enable the next button
                                wizardNextBtn.hideLoader();
                                wizardNextBtn.enable();
                                
                                // Clear the document file
                                // documentFile = null;
                                // documentNameDisplay.setValue('...');
                            }
                        }
                    });
                }, 
                20000
            );
            
            // Get execptions, if any
            lx.sendJSON({
                url: 'exec.php?c=Employee&fn=getImportExceptionList',
                files: [
                    {name: 'document', file: documentFile, fileName: documentFile.fileName}
                ],
                onSuccess: function( responseText ) {
                    // Clear the file upload timeout
                    clearTimeout( fileUploadTimeout );
                    
                    let response = JSON.parse(responseText);
                    
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                        
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Getting Exceptions Failed',
                            message: response.error
                        });
                        return;
                    }
                    
                    // Are there existing employees in the import file?
                    if( response.updateCount > 0 ) {
                        importMessageEl.innerHTML = 'A total of <b>' + response.importCount + '</b> new employees and <b>'  + response.updateCount + '</b> existing employees were found. Do you wish to ignore or update the existing employees?';
                        updateEmployeesRadioContainerEl.style.display = 'block';
                    }
                    else {
                        importMessageEl.innerHTML = 'A total of <b>' + response.importCount + '</b> new employees and <b>'  + response.updateCount + '</b> existing employees were found.';
                        updateEmployeesRadioContainerEl.style.display = 'none';
                    }
                    
                    // Are there no exeptions?
                    if( response.exceptions.length <= 0 ) {
                        exceptionsMessageEl.innerHTML = '<div style="font-size: 14px;">No exceptions found. Click the \'Finish\' button to import the employees.</div>';
                        exceptionDetailsContainerEl.style.display = 'none';
                    }
                    else {
                        exceptionsMessageEl.innerHTML = 
                            '<div style="font-size: 12px;">' + 
                                'Exceptions were found. Please check each warning (indicated by the ' + 
                                '<i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i> ' + 
                                'icon) to verify that you are aware of them (you can check or uncheck all the exceptions ' + 
                                'at once by clicking on the check mark in the heading of the check column).<br><br>' +
                                'IMPORTANT: You will not be able to import employees if ' + 
                                'there are any critical exceptions (indicated by the ' + 
                                '<i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i> ' + 
                                'icon).' + 
                            '</div>';
                        exceptionDetailsContainerEl.style.display = 'flex';
                    }
                    
                    exceptions = response.exceptions;
                    
                    let rows = [];
                    hasCriticalExceptions = false;
                    for( var i = 0; i < response.exceptions.length; i++ ) {
                        var statusIcon = '<i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i>';
                        if( response.exceptions[i].isCritical ) {
                            statusIcon = '<i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i>';
                            hasCriticalExceptions = true;
                        }
                        
                        rows.push({
                            statusIcon: statusIcon,
                            isCritical: '<span style="font-size: 12px">' + response.exceptions[i].isCritical + '</span>',
                            columnNumber: '<span style="font-size: 12px">' +  (response.exceptions[i].column === null ? '-' :  response.exceptions[i].column) + '</span>',
                            rowNumber: '<span style="font-size: 12px">' + (response.exceptions[i].row === null ? '-' : response.exceptions[i].row) + '</span>',
                            value: '<span style="font-size: 12px">' + response.exceptions[i].value + '</span>',
                            description: '<span style="font-size: 12px">' + response.exceptions[i].description + '</span>',
                            fullDescription: '<span style="font-size: 12px">' + response.exceptions[i].fullDescription + '</span>',
                            showMore: '<span style="font-size: 12px">More details...</span>'
                        });
                    }
                    
                    // Clear the grid and add the exceptions
                    exceptionsGrid.clear();
                    exceptionsGrid.addRows( rows );
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Exception Report (' + pageNum + '/2)';
                    
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
            // Are there critical exceptions?
            if( hasCriticalExceptions ) {
                wizardNextBtn.showWarning(
                    'Unable to import employees. Critical exceptions found.'
                );
                return;
            }
            
            // Are there critical exceptions?
            if( exceptionsGrid.getSelectedRowCount() !== exceptionsGrid.getRowCount() ) {
                wizardNextBtn.showWarning(
                    'Unable to import employees. One or more exceptions have not been checked.'
                );
                return;
            }
            
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            wizardPreviousBtn.disable();
            
            // Set a timeout for the file upload in case the user edited the file after it was selected
            const fileUploadTimeout = setTimeout(function() {
                    new lx.component.Messagebox({
                        title: 'The process is taking a long time',
                        message: 
                            'Certain browsers will not allow you to upload a file if it was edited after it had been selected.<br><br>' +
                            'Please select \'Retry\', re-select the import file, and click the \'Next\' button to try again or select the ' + 
                            '\'Continue\' option if you are importing a particularly large file.',
                        buttons: [
                            {name: 'continue', label: 'Continue', style: 'text', isCancel: true},
                            {name: 'retry', label: 'Retry', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'retry' ) {
                                // Enable the next button
                                wizardNextBtn.hideLoader();
                                wizardNextBtn.enable();
                                wizardPreviousBtn.enable();
                                
                                // Clear the document file
                                // documentFile = null;
                                // documentNameDisplay.setValue('...');
                            }
                        }
                    });
                }, 
                20000
            );
            
            // Get execptions, if any
            lx.sendJSON({
                url: 'exec.php?c=Employee&fn=import',
                data: {
                    updateEmployees: updateEmployeesRadio.getValue()
                },
                files: [
                    {name: 'document', file: documentFile, fileName: documentFile.fileName}
                ],
                onSuccess: function( responseText ) {
                    // Clear the file upload timeout
                    clearTimeout( fileUploadTimeout );
                    
                    let response = JSON.parse(responseText);
                    
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    wizardPreviousBtn.enable();
                        
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Importing Employees Failed',
                            message: response.error
                        });
                        return;
                    }

                    // console.log(" finish event should be fired");
                    
                    // Fire the finish event
                    // me.fireEvent('finish', {srcPanel: me});
                    me.fireEvent('import', {srcPanel: me});
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
            
            onClose: function() {
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: exportExceptionsModal
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        exportExceptionsModal.showModal();
        exportExceptionsModal.focus();
    }
    
    // Document upload element event handler
    me.documentUploadElEventHandler = function() {
        let showError = false;
        let fileList = '';
        let errorMessage = '';
        
        let allowedExtenstions = ['csv']; // ['csv','xlsx'];
        
        if( documentUploadEl.files.length < 1 ) {
            return;
        }
        
        documentNameDisplay.setValue('');
        documentFile = null;
        
        if( documentUploadEl.files.length > 1 ) {
            errorMessage = 'Multiple files were selected but only a single file may be imported at a time.';
            showError = true;
        }
        
        if( !showError ) {
            errorMessage = 'The following files failed to upload: </br>';
            
            for( var i = 0; i < documentUploadEl.files.length; i++ ) {
                // Was a valid file received?
                if( typeof documentUploadEl.files[i] != "undefined" ) {
                    
                    let fileExtenstion = documentUploadEl.files[i].name.split('.').pop();
                    
                    // Is the file larger than the limit?
                    var fileSize = documentUploadEl.files[i].size / 1024 / 1024;
                    if (fileSize > 50 ) {
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
                    documentNameDisplay.setValue( documentUploadEl.files[i].name );
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
                    {name: 'ok', label: 'Ok'}
                ]
            });
        }
    };
    
    // Browse document button click event handler
    function browseDocumentBtnElClickEventHandler() {
        documentUploadEl.value = null;
        
        // Simulate a click event on the document upload element
        if( documentUploadEl.click ) {
            documentUploadEl.click();
        }
        else if( documentUploadEl.dispatchEvent ) {
            documentUploadEl.dispatchEvent( new Event('click') );
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};