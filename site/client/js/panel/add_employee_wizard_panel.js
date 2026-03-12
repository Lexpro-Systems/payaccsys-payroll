/* globals app, lx */
'use strict';


// ADD EMPLOYEE WIZARD PANEL
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
app.panel.AddEmployeeWizard = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    var mainContainerEl = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var wizardSectionEl = null;
    var wizardHeadingContainerEl = null;
    var wizardHeadingEl = null;
    var wizardContentContainerEl = null;
    var wizardPageContainerEl = null;
    var wizardButtonContainerEl = null;
    var wizardCancelBtn = null;
    var wizardPreviousBtn = null;
    var wizardNextBtn = null;
    
    var codeMask = null;
    var formChanged = false;
    
    var wizardPage1ContainerEl = null;
    var personalDetailsHeadingEl = null;
    var personalDetailsSectionEl = null;
    var codeTxt = null;
    var titleSelect = null;
    var initialsTxt = null;
    var fullNamesTxt = null;
    var lastNameTxt = null;
    var aliasTxt = null;
    var idNumberTxt = null;
    var passportNumberTxt = null;
    var passportCountrySelect = null;
    var dateOfBirthDate = null;
    var asylumSeekerCb = null;
    var refugeeCb = null;
    var retiredCb = null;
    var employmentDetailsHeadingEl = null;
    var employmentDetailsSectionEl = null;
    var employmentStartDate = null;
    var employmentPositionTxt = null;
    var departmentSectionEl = null;
    var departmentSelect = null;
    var addDepartmentBtn = null;
    var paymentMethodSelect = null;
    var paymentPeriodSelect = null;
    var paymentPeriodEndDaySelect = null;
    var paymentDaySelect = null;
    var taxDetailsHeadingEl = null;
    var taxDetailsSectionEl = null;
    var incomeTaxNumberTxt = null;
    var sicCodeSelect = null;
    var enablePayeCorrectionCb = null;
    var taxDirective1HeadingEl = null;
    var taxDirective1SectionEl = null;
    var incomeTaxDirective1Txt = null;
    var incomeTaxDirective1IssuedOnDate = null;
    var incomeTaxDirective1SourceTxt = null;
    var incomeTaxDirective1AmountTxt = null;
    var taxDirective2HeadingEl = null;
    var taxDirective2SectionEl = null;
    var incomeTaxDirective2Txt = null;
    var incomeTaxDirective2IssuedOnDate = null;
    var incomeTaxDirective2SourceTxt = null;
    var incomeTaxDirective2AmountTxt = null;
    var taxDirective3HeadingEl = null;
    var taxDirective3SectionEl = null;
    var incomeTaxDirective3Txt = null;
    var incomeTaxDirective3IssuedOnDate = null;
    var incomeTaxDirective3SourceTxt = null;
    var incomeTaxDirective3AmountTxt = null;
    
    var wizardPage2ContainerEl = null;
    var contactDetailsHeadingEl = null;
    var contactDetailsSectionEl = null;
    var homeNumberTxt = null;
    var workNumberTxt = null;
    var cellNumberTxt = null;
    var faxNumberTxt = null;
    var emailAddressTxt = null;
    var emergencyContactPersonTxt = null;
    var emergencyContactNumberTxt = null;
    var physicalAddressHeadingEl = null;
    var physicalAddressSectionEl = null;
    var physicalAddressUnitTxt = null;
    var physicalAddressComplexTxt = null;
    var physicalAddressStreetTxt = null;
    var physicalAddressSuburbTxt = null;
    var physicalAddressCityTxt = null;
    var physicalAddressPostalCodeTxt = null;
    var physicalAddressCountrySelect = null;
    var postalAddressHeadingEl = null;
    var postalAddressCb = null;
    var postalAddressSectionEl = null;
    var postalAddressContainerEl = null;
    var postalAddressLine1Txt = null;
    var postalAddressLine2Txt = null;
    var postalAddressLine3Txt = null;
    var postalAddressCodeTxt = null;
    var postalAddressCountrySelect = null;
    var workAddressHeadingEl = null;
    var workAddressSectionEl = null;
    var useCompanyWorkAddressCb = null;
    var workAddressContainerEl = null;
    var workAddressUnitTxt = null;
    var workAddressComplexTxt = null;
    var workAddressStreetTxt = null;
    var workAddressSuburbTxt = null;
    var workAddressCityTxt = null;
    var workAddressPostalCodeTxt = null;
    var workAddressCountrySelect = null;
    var bankDetailsHeadingEl = null;
    var bankDetailsSectionEl = null;
    var bankDetailsInsitutionSelect = null;
    var bankDetailsAccountTypeRadio = null;
    var bankDetailsAccountNumberTxt = null;
    var bankDetailsBranchCodeTxt = null;
    
    var wizardPage3ContainerEl = null;
    let payslipItemSectionEl = null;
    let paylsipItemContainerEl = null;
    let addPayslipItemContainerEl = null;
    let addPayslipItemSelect = null;
    // let restoreDefaultPayslipItemsBtn = true;
    let addDefaultPayslipItems = true;
    let payslipItemTypes = null;
    let payslipItems = [];
    
    var wizardPage4ContainerEl = null;
    let providentFundSectionEl = null;
    let providentFunds = [];
    
    var wizardPage5ContainerEl = null;
    let leaveTypeSectionEl = null;
    var leaveTypes = [];
    
    var wizardPage6ContainerEl = null;
    var workScheduleSectionEl = null;
    var workScheduleNoteDisplay = null;
    var workScheduleCb = null;
    var workScheduleContainerEl = null;
    var mondayContainer = null;
    var mondayCb = null;
    var mondayHoursTxt = null;
    var mondayHoursLabel = null;
    var tuesdayContainer = null;
    var tuesdayCb = null;
    var tuesdayHoursTxt = null;
    var tuesdayHoursLabel = null;
    var wednesdayContainer = null;
    var wednesdayCb = null;
    var wednesdayHoursTxt = null;
    var wednesdayHoursLabel = null;
    var thursdayContainer = null;
    var thursdayCb = null;
    var thursdayHoursTxt = null;
    var thursdayHoursLabel = null;
    var fridayContainer = null;
    var fridayCb = null;
    var fridayHoursTxt = null;
    var fridayHoursLabel = null;
    var saturdayContainer = null;
    var saturdayCb = null;
    var saturdayHoursTxt = null;
    var saturdayHoursLabel = null;
    var sundayContainer = null;
    var sundayCb = null;
    var sundayHoursTxt = null;
    var sundayHoursLabel = null;
    
    var pageNum = 1;
    var numPages = 6;
    var pagePadding = '0px 15px 15px 15px';
    var pageBackgroundColor = '#F5F6F7';
    var sectionBackgroundColor = '#FFFFFF';
    
    var allocationTypes = [
        { value: 'ADJU', text: 'Adjustment' },
        { value: 'LEAR', text: 'Leave Earned' },
        { value: 'LTAK', text: 'Leave Taken' },
        { value: 'RESE', text: 'Reset' }
    ];
    
    // Set warning icon
    let warningIconEl =
        '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 1280.000000 1138.000000"' + 
        'preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,1138.000000) scale(0.100000,-0.100000)"' + 
        'fill="#E75B54" stroke="none">' + 
        '<path d="M6280 11374 c-14 -2 -51 -9 -83 -15 -252 -45 -510 -210 -661 -422 -24 -34 -754 -1293 -1621 -2797 -868 -1504 -2077 -3601 -2688 -4660 -611 ' + 
        '-1059 -1125 -1959 -1142 -2000 -119 -280 -110 -601 25 -876 140 -287 381 -485 698 -572 l97 -27 5495 0 5495 0 97 27 c317 87 558 285 698 572 136 277 145 ' + 
        '590 25 876 -17 41 -531 941 -1142 2000 -611 1059 -1820 3156 -2688 4660 -867 1504 -1597 2763 -1621 2797 -189 266 -496 428 -829 438 -71 2 -141 2 -155 -1z ' + 
        'm137 -1086 c6 -13 330 -576 720 -1253 390 -676 1321 -2290 2068 -3585 747 -1295 1621 -2809 1941 -3365 l583 -1010 -2665 -3 c-1465 -1 -3863 -1 -5328 0 ' + 
        'l-2665 3 289 500 c1005 1744 2443 4238 3645 6322 765 1327 1393 2412 1396 2413 3 0 10 -10 16 -22z"/>' + 
        '<path d="M6275 7456 c-338 -64 -584 -357 -585 -694 0 -45 27 -233 70 -490 257 -1521 290 -1713 300 -1750 23 -85 111 -185 198 -225 67 -31 217 -31 284 0 87 ' + 
        '40 175 140 198 225 5 18 39 209 75 423 36 215 86 507 110 650 187 1098 188 1105 182 1205 -14 258 -166 484 -402 596 -134 64 -294 86 -430 60z"/>' + 
        '<path d="M6313 3549 c-415 -48 -701 -459 -603 -868 62 -257 270 -466 525 -527 90 -21 240 -21 330 0 377 90 615 478 525 855 -84 351 -416 581 -777 540z"/> ' + 
        '</g></svg>';
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    // lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to format a string as a numerical value with the given precision
    function formatNumerical(value, precision) {
        // var precision = 4;
        var valueParts = ('' + parseFloat(value).toFixed(precision)).split('.');
        var strParts = [];
        
        var offset = 0;
        if( valueParts[0][0] === '-' || valueParts[0][0] === '+' ) offset = ((valueParts[0].length - 1) % 3) + 1;
        else offset = valueParts[0].length % 3;
        
        if( offset > 0 ) strParts.push(valueParts[0].substr(0, offset));
        
        for( var i = 0; i < (valueParts[0].length - offset) / 3; i++ ) {
            strParts.push(valueParts[0].substring(offset + (i * 3), offset + (i * 3) + 3));
        }
        
        return strParts.join(' ') + '.' + valueParts[1];
    }
    
    // Function to parse to convert a numerical string value to a floating point value
    function parseNumerical( value ) {
        return parseFloat( String(value).replace(/\s/g, '') );
    }
    
    // Function to load country values into a selectbox.
    //
    // srcSelect            Can be a single select or an array of selectboxes to load the countries into.
    function loadCountries( srcSelect ) {
        // Build data to send
        var data = {};
        if( lx.isArray(srcSelect) ) {
            data = {
                limit: 20,
                offset: 0,
                sortOrder: 'ASC'
            };
        }
        else {
            data = {
                searchString: srcSelect.getSearchString(),
                limit: 20,
                offset: srcSelect.getItemCount(),
                sortOrder: 'ASC'
            };
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: data,
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Countries Failed',
                        message: response.error
                    });
                }
                
                var countries = [];
                for( var i = 0; i < response.countries.length; i++ ) {
                    countries.push({
                        value: response.countries[i].code,
                        text: response.countries[i].name
                    });
                }
                
                // If srcSelect is an array, add the countries to each select component in the array.  Otherwise it should be a single
                // select component.
                if( lx.isArray(srcSelect) ) {
                    for( let i = 0; i < srcSelect.length; i++ ) srcSelect[i].addItems( countries );
                }
                else {
                    srcSelect.addItems( countries );
                }
            }
        });
    }
    
    // Function to load the next available employee code.
    //
    // callback             A function to call after the next code was retreived.
    function getNextEmployeeCode( callback ) {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getNextAvailableCode',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable To Get Next Available Code',
                        message: response.error
                    });
                }
                
                codeTxt.setValue( response.nextEmployeeCode );
                codeMask = response.employeeCodeMask;
                
                if( typeof callback !== 'undefined' && callback !== null ) callback.call(this);
            }
        });
    }
    
    // Function to load employee titles.
    function loadTitles() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getTitleList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Titles Failed',
                        message: response.error
                    });
                }
                
                var titles = [];
                for( var i = 0; i < response.titles.length; i++ ) {
                    titles.push({
                        value: response.titles[i].code,
                        text: response.titles[i].name
                    });
                }
                
                titleSelect.clear();
                titleSelect.addItems( titles );
            }
        });
    }
    
    // Function to load departments
    function loadDepartments(defaultId, defaultName) {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                var departments = [];
                departments.push({value: null, text: 'None'});
                for( var i = 0; i < response.departments.length; i++ ) {
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                }
                
                departmentSelect.clear();
                departmentSelect.addItems( departments );
                departmentSelect.setValue( defaultId, defaultName );
            }
        });
    }
    
    // Function to load payment methods
    function loadPaymentMethods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentMethodList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }
                
                var paymentMethods = [];
                for( var i = 0; i < response.paymentMethods.length; i++ ) {
                    paymentMethods.push({
                        value: response.paymentMethods[i].code,
                        text: response.paymentMethods[i].name
                    });
                }
                
                paymentMethodSelect.clear();
                paymentMethodSelect.addItems( paymentMethods );
            }
        });
    }
    
    // Function to load payment periods
    function loadPaymentPeriods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentPeriodList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }
                
                var paymentPeriods = [];
                for( var i = 0; i < response.paymentPeriods.length; i++ ) {
                    // if( response.paymentPeriods[i].code === 'BWEE' ) continue; // Hide the bi-weekly option for now
                    paymentPeriods.push({
                        value: response.paymentPeriods[i].code,
                        text: response.paymentPeriods[i].name
                    });
                }
                
                paymentPeriodSelect.clear();
                paymentPeriodSelect.addItems( paymentPeriods );
                paymentPeriodSelect.setValue( 'MONT', 'Monthly');
                paymentPeriodSelectChangeEventHandler();
                formChanged = false;
            }
        });
    }
    
    // Function to load the company's SIC code
    function loadDefaultSicCode() {
        // Use company SIC code as default value
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Company Details Failed',
                        message: response.error
                    });
                }
                
                sicCodeSelect.setValue( response.company.details.sicCode, response.company.details.sicName );
            }
        });
    }
    
    // Function to load SIC codes
    function loadSicCodes() {
        lx.sendJSON({
            url: 'exec.php?c=Types&fn=getSicCodeList',
            data: {
                searchString: sicCodeSelect.getSearchString(),
                limit: 20,
                offset: sicCodeSelect.getItemCount(),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading SIC Codes Failed',
                        message: response.error
                    });
                }
                
                var sicCodes = [];
                for( var i = 0; i < response.sicCodes.length; i++ ) {
                    sicCodes.push({
                        value: response.sicCodes[i].code,
                        text: response.sicCodes[i].code + ': ' + response.sicCodes[i].name
                    });
                }
                sicCodeSelect.addItems( sicCodes );
            }
        });
    }
    
    // Function to load financial institutions into a selectbox.
    //
    // srcSelect            The select control to load the financial institutions into
    function loadFinancialInstitutions( srcSelect ) {
        // Build data to send
        var data = {
            searchString: srcSelect.getSearchString(),
            limit: 20,
            offset: srcSelect.getItemCount(),
            sortOrder: 'ASC'
        };
        
        // Send the request to get the financial institution data
        lx.sendJSON({
            url: 'exec.php?c=FinancialInstitution&fn=getList',
            data: data,
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
                
                // Add the institutions to an array
                var institutions = [];
                for( var i = 0; i < response.institutions.length; i++ ) {
                    institutions.push({
                        value: response.institutions[i].code,
                        text: response.institutions[i].name
                    });
                }
                
                // Add the items to the select
                srcSelect.addItems( institutions );
            }
        });
    }
    
    // Function to load paylsip types
    function loadPayslipItemTypes( srcComponent ) {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getPayslipItemTypeList',
            data: {
                searchString: srcComponent.getSearchString(),
                sortOrder: 'ASC',
                isOnceOff: false
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Item Types Failed',
                        message: response.error
                    });
                }
                
                // Store item types
                if(payslipItemTypes === null) payslipItemTypes = response.itemTypes;
                
                // Add item types to the srcComponent component
                let selectItems = [];
                for( let i = 0; i < response.itemTypes.length; i++ ) {
                    selectItems.push({
                        value: response.itemTypes[i].code,
                        text: 
                            '<div style="display: flex; flex-direction: row; flex 1 1 100%;">' + 
                                '<div style="margin: auto auto auto 0px;">' + 
                                    response.itemTypes[i].name +
                                '</div>' + 
                                '<div style="color: #DFDFDF;">' + 
                                    '[' + response.itemTypes[i].category.name + ']' +
                                '</div>' + 
                            '</div>'
                    });
                }
                srcComponent.addItems( selectItems );
                
                // Should the defualt items be added?
                if( addDefaultPayslipItems ) {
                    // Add default items
                    createPayslipItemCard('3002');
                    createPayslipItemCard('3001');
                    createPayslipItemCard('2002');
                    createPayslipItemCard('2000');
                    createPayslipItemCard('1000');
                    addDefaultPayslipItems = false;
                }
                
            }
        });
    }
    
    // Function to create a once off item
    //
    // ruleData             The data for the rule.
    // insertIndex          The index to insert the new rule at.  For example if the index is given as 3 then after inserting the new rule will be
    //                      at index 3 and the rule previously at 3 will be at 4.
    function createPayslipItemCard( itemTypeCode ) {
        // Find the item type to load
        let itemType = null;
        for( let i = 0; i < payslipItemTypes.length; i++ ) {
            if( payslipItemTypes[i].code === itemTypeCode ) itemType = payslipItemTypes[i];
        }
        
        // Check that the item type was found.
        if( itemType === null ) {
            console.log('app.panel.AddEmployeeEarnings : ERROR : Invalid item type code provided to createRecurringItem.');
        }
        
        let itemEl = lx.createElement('DIV', {
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                boxSizing: 'border-box',
                padding: '15px',
                margin: '15px 0px 0px 0px',
                // borderRadius: '15px'
            }
        });
        paylsipItemContainerEl.insertBefore(itemEl, paylsipItemContainerEl.children[0]);
        
        // Create the rulesContainerEl
        let firstContainer = lx.createElement('DIV', {
            parent: itemEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                boxSizing: 'border-box'
            }
        });
        
        // Create the itemDescriptionTxt component
        let itemDescriptionTxt = new lx.component.Textbox({
            renderTo: firstContainer,
            label: 'Description',
            flex: '1 1 auto',
            
            onChange: function() {
                formChanged = true;
            }
        });
        itemDescriptionTxt.setValue(itemType.name);
        
        // Create the itemAutoContainer component
        let itemAutoCheckContainer = lx.createElement('DIV', {
            parent: firstContainer,
            style: {
                display: 'flex',
                margin: '16px 0px 0px 20px'
            }
        });
        
        // Create the itemAutoCheck component
        let itemAutoCheck = new lx.component.Checkbox({
            renderTo: itemAutoCheckContainer,
            label: 'Auto Calculate',
            labelAlign: 'right',
            labelWidth: '100px',
            margin: '00px',
            width: '',
            
            onChange: function() {
                if( itemAutoCheck.getValue() === true ) itemAmountTxt.disable();
                else itemAmountTxt.enable();
                formChanged = true;
            }
        });
        
        // Create the importHoursContainer component
        let importHoursContainer = lx.createElement('DIV', {
            parent: firstContainer,
            style: {
                display: 'none',
                margin: '16px 0px 0px 20px'
            }
        });
        
        // Create the importHoursCheck component
        let importHoursCheck = new lx.component.Checkbox({
            renderTo: importHoursContainer,
            label: 'Use Attendance Register Hours',
            labelAlign: 'right',
            labelWidth: '100px',
            margin: '0px 0px 0px 0px',
            width: ''
        });
        
        // Create the partOfNettPayContainer component
        let partOfNettPayContainer = lx.createElement('DIV', {
            parent: firstContainer,
            style: {
                display: 'none',
                margin: '16px 0px 0px 20px'
            }
        });
        
        // Create the importHoursCheck component
        let partOfNettPayCheck = new lx.component.Checkbox({
            renderTo: partOfNettPayContainer,
            label: 'Part of Nett Pay',
            labelAlign: 'right',
            labelWidth: '100px',
            margin: '0px 0px 0px 0px',
            width: ''
        });
        partOfNettPayCheck.setValue(itemType.includeInNettPay);
        
        // Create the itemAmountTxt component
        let itemAmountTxt = new lx.component.Textbox({
            renderTo: firstContainer,
            label: 'Amount',
            textAlign: 'right',
            margin: '0px 0px 0px 20px',
            width: '165px',
            
            onFocus: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(lx.util.formatCurrency(value));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: function() {
                formChanged = true;
            }
        });
        
        // Create removeEl el
        let removeEl =  lx.createElement('DIV', {
            parent: firstContainer,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '20px',
                minWidth: '20px',
                height: '20px',
                minHeight: '20px',
                margin: 'auto 0px 7.5px 15px',
                fontSize: '14px',
                color:  '#FFFFFF',
                backgroundColor: '#E75B54', // lx.style.global.highlightColor,
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-times" style="margin: auto auto;"></i>'
        });
        removeEl.addEventListener('click', recurringItemRemoveBtnElClickEventHandler);
        
        // let removeEl = lx.createElement('DIV', {
        //     parent: firstContainer,
        //     style: {
        //         margin: '16px 0px 0px 20px',
        //         padding: '9px 12px',
        //         cursor: 'pointer',
        //         fontSize: '15px',
        //     },
        //     innerHTML: '<i class="fa fa-times"></i>'
        // });
        // removeEl.addEventListener('click', recurringItemRemoveBtnElClickEventHandler);
        
        // Create the rulesContainerEl
        let secondContainer = lx.createElement('DIV', {
            parent: itemEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
            }
        });
        
        // Create the itemTypeDisplay component
        new lx.component.Display({
            renderTo: secondContainer,
            label: 'Type:',
            labelWidth: '60px',
            width: '537px',
            fontSize: '12px',
            color: '#B4B6B7',
            labelColor: '#B4B6B7',
            value: itemType.name
        });
        
        // Create the itemCategoryDisplay component
        new lx.component.Display({
            renderTo: secondContainer,
            label: 'Category:',
            labelWidth: '60px',
            width: '537px',
            fontSize: '12px',
            color: '#B4B6B7',
            labelColor: '#B4B6B7',
            value: itemType.category.name
        });
        
        payslipItems.push({
            el: itemEl,
            itemTypeCode: itemType.code,
            itemTypeName: itemType.name,
            unitTypeCode: itemType.unit.code,
            descriptionTxt: itemDescriptionTxt,
            itemAutoCheckbox: itemAutoCheck,
            importHoursCheckbox: importHoursCheck,
            partOfNettPayCheckbox: partOfNettPayCheck,
            itemAmountTxt: itemAmountTxt,
            categoryCode: itemType.category.code,
            uniqueId: Date.now()
        });
        
        // Update the amount label depending on unit
        if( itemType.unit.code === 'FIXE' ) {
            itemAmountTxt.setLabel('Amount');
            lx.applyStyle(importHoursContainer, {display: 'none'});
        }
        else if( itemType.unit.code === 'PHOU') {
            itemAmountTxt.setLabel('Hourly Rate');
            // Is it an hourly wage?
            if( itemType.code == '1001' ) {
                lx.applyStyle(importHoursContainer, {display: 'flex'});
                }
            else {
                lx.applyStyle(importHoursContainer, {display: 'none'});
            }
            lx.applyStyle(itemAutoCheckContainer, {display: 'none'});
        }
        else if( itemType.unit.code === 'PDAY') {
            itemAmountTxt.setLabel('Daily Rate');
            lx.applyStyle(importHoursContainer, {display: 'none'});
        }
        else if( itemType.unit.code === 'PKIL') {
            itemAmountTxt.setLabel('Rate Per Kilometer');
            lx.applyStyle(importHoursContainer, {display: 'none'});
        }
        else if( itemType.unit.code === 'PERC') {
            itemAmountTxt.setLabel('Percentage');
            lx.applyStyle(importHoursContainer, {display: 'none'});
        }
        
        // Is it a fringe benefit?
        if( itemType.category.code === 'FBEN' ) {
            lx.applyStyle(partOfNettPayContainer, {display: 'flex'});
            lx.applyStyle(itemAutoCheckContainer, {display: 'none'});
        }
        else {
            lx.applyStyle(partOfNettPayContainer, {display: 'none'});
            lx.applyStyle(itemAutoCheckContainer, {display: 'flex'});
        }
        
        // Set auto calculate depending on the selected item type.
        if( itemType.autoCalculate === true ) {
            itemAutoCheck.enable();
            itemAutoCheck.setValue(true);
            itemAmountTxt.disable();
        }
        else {
            itemAutoCheck.disable();
            itemAutoCheck.setValue(false);
            itemAmountTxt.enable();
        }
        
        // Focus the description of the new item
        itemDescriptionTxt.focus();
        itemDescriptionTxt.select();
    }
    
    // Function to create the provident fund display elements
    //
    // providentFundIndex       The index of the provident fund to display.
    // providentFundData        The data for the provident fund income.
    function createProvidentFundSection( providentFundIndex, providentFundData ) {
        let fundContainerEl = null;
        
        // Does a provident fund container exist?
        if( providentFunds[providentFundIndex].fundContainerEl !== null ) {
            // Clear the provident fund container
            fundContainerEl = providentFunds[providentFundIndex].fundContainerEl;
            fundContainerEl.innerHTML = '';
        }
        else {
            // Create the fund's container
            fundContainerEl = lx.createElement('DIV', {
                parent: providentFundSectionEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    // maxWidth: '900px',
                    margin: '20px 0px 0px 0px',
                    backgroundColor: '#FFFFFF',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    borderColor: '#DFDFDF',
                    minWidth: '532px'
                }
            });
        }
        
        // Create the fund's heading
        let fundHeadingEl = lx.createElement('DIV', {
            parent: fundContainerEl,
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
        
        // Create the fund's heading bar
        let fundHeadingContainerEl = lx.createElement('DIV', {
            parent: fundHeadingEl,
            style: {
                margin: '0px 0px 0px 0px',
                display: 'flex',
                flexDirection: 'row',
            }
        });
        
        // Create the subscribe checkbox
        let subscribeProvidentFundCb = new lx.component.Checkbox({
            renderTo: fundHeadingContainerEl,
            label: null,
            margin: '0px 10px 0px 0px',
            width: ''
        });
        subscribeProvidentFundCb.addEventListener('click', subscribeProvidentFundCbChangeEventHandler.bind(me, {id: providentFundData.id}));
        subscribeProvidentFundCb.setValue(false);
        
        lx.createElement('DIV', {
            parent: fundContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                padding: '15px 15px'
                
            },
            innerHTML: 'The employee is not a member of this retirement fund.'
        });
        
        // Save the provident fund details
        providentFunds[providentFundIndex].name = providentFundData.providentFundName;
        providentFunds[providentFundIndex].subscribeCb = subscribeProvidentFundCb;
        providentFunds[providentFundIndex].fundContainerEl = fundContainerEl;
        providentFunds[providentFundIndex].rfiItems = [];
        providentFunds[providentFundIndex].typeCode = providentFundData.providentFundCalculationTypeCode;
        providentFunds[providentFundIndex].employeeAmount = providentFundData.employeeAmount;
        providentFunds[providentFundIndex].employerAmount = providentFundData.employerAmount;
        
        // Set the provident fund's name
        lx.createElement('DIV', {
            parent: fundHeadingContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            },
            innerHTML: providentFundData.providentFundName
        });
    }
    
    // Function to add a retirement fund incomr item.
    //
    // providentFundIndex       The index of the provident fund for which to add the rfi item.
    // rfiItemData              The data for the retirment fund income item.
    // insertIndex              The index to insert the new retirement fund income item at. For example if the 
    //                          index is given as 3 then after inserting the new rule will be at index 3 and 
    //                          the rule previously at 3 will be at 4.
    function addRfiItem(providentFundIndex, rfiItemData, insertIndex, rfiItemContainerEl) {
        // Set styles depending wheter items have been added already for the specified provident fund
        let rfiItemMargin = '0px';
        for( let i = 0; i < providentFunds[providentFundIndex].rfiItems.length; i++ ) {
            if( providentFunds[providentFundIndex].rfiItems[i].providentFundId === rfiItemData.providentFundId ) {
                rfiItemMargin = '15px';
                break;
            }
        }
        
        // Create retirment fund income item element
        let rfiItemEl = lx.createElement('DIV', {
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '35px',
                margin: rfiItemMargin + ' 0px 0px 0px'
            }
        });
        
        // Create selectedCb component
        let selectedCb = new lx.component.Checkbox({
            renderTo: rfiItemEl,
            width: '40px',
            
            onChange: rfiItemSelectedCbOnChangeEventHandler
        });
        if( rfiItemData.id === null ) {
            selectedCb.setValue(false);
        }
        else {
            selectedCb.setValue(true);
        }
        
        // Create descriptionTxt component
        let descriptionDisplay = new lx.component.Display({
            renderTo: rfiItemEl,
            width: '320px',
            // flex: '1 1 auto',
            margin: '0px 0px 0px 10px'
        });
        descriptionDisplay.setValue(rfiItemData.description);
        
        // Create percentageTxt component
        let percentageTxt = new lx.component.Textbox({
            renderTo: rfiItemEl,
            width: '165px',
            margin: '0px 0px 0px 10px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(lx.util.formatCurrency(value));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            validators: [
                function(value) {
                    let amount = lx.util.parseCurrency( value );
                    
                    if( value === '' ) {
                        return 'The percentage for &quot;' + rfiItemData.description + '&quot; should be between 0 and 100';
                    }
                    else if( parseInt(amount) > 100 ) {
                        return 'The percentage for &quot;' + rfiItemData.description + '&quot; should be between 0 and 100';
                    }
                    else if( parseInt(amount) < 0 ) {
                        return 'The percentage for &quot;' + rfiItemData.description + '&quot; should be between 0 and 100';
                    }
                    return true;
                }
            ],
            
            onChange: rfiItemPercentageTxtOnChangeEventHandler
        });
        percentageTxt.setValue(lx.util.formatCurrency( rfiItemData.percentage ));
        if( rfiItemData.id === null ) {
            percentageTxt.disable();
        }
        
        // Add the rule into the rulesContainerEl at given index.
        if( typeof insertIndex === 'undefined' || insertIndex === null || insertIndex >= providentFunds[providentFundIndex].rfiItems.length || insertIndex < 0 ) {
            rfiItemContainerEl.appendChild( rfiItemEl );
            
            // Add rule to the rules array
            providentFunds[providentFundIndex].rfiItems.push({
                el: rfiItemEl,
                selectedCb: selectedCb,
                percentageTxt: percentageTxt,
                payslipItemTypesCode: rfiItemData.payslipItemTypesCode,
                uniqueId: rfiItemData.uniqueId
            });
        }
        else {
            rfiItemContainerEl.insertBefore(rfiItemEl, providentFunds[providentFundIndex].rfiItems[insertIndex].el);
            
            // Add rule to the rules array
            providentFunds[providentFundIndex].rfiItems.splice(insertIndex, 0, {
                el: rfiItemEl,
                selectedCb: selectedCb,
                percentageTxt: percentageTxt,
                payslipItemTypesCode: rfiItemData.payslipItemTypesCode,
                uniqueId: rfiItemData.uniqueId
            });
        }
    }
    
    // Function to set focus to a given rfi item
    function focusRfiItem( providentFundIndex, rfiItemIndex ) {
        if( rfiItemIndex < 0 || rfiItemIndex >= providentFunds[providentFundIndex].rfiItems.length ) return;
        
        providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.focus();
    }
    
    // Function to load provident funds
    function loadProvidentFunds() {
        providentFunds = [];
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=getList',
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Retirement Funds Failed',
                        message: result.error
                    });
                    
                    return;
                }
                
                // Add provident fund sections
                for( let i = 0; i < result.providentFunds.length; i++ ) {
                    // Save the provident fund details
                    providentFunds.push({
                        id: result.providentFunds[i].id,
                        name: result.providentFunds[i].providentFundName,
                        subscribeCb: false,
                        fundContainerEl: null,
                        rfiItems: []
                    });
                    let providentFundIndex = providentFunds.length - 1;
                    
                    // Create the specified provident fund
                    createProvidentFundSection( providentFundIndex, result.providentFunds[i] );
                }
            }
        });
    }
    
    // Updates rfi items from earnings page
    function updateRfiItems() {
        // Get earning items
        let earningItems = [];
        for (let i = 0; i < payslipItems.length; i++) {
            if(payslipItems[i].itemTypeCode !== null) {
                let amount = payslipItems[i].itemAmountTxt.getValue();
                if(payslipItems[i].itemAutoCheckbox.getValue() === true) {
                    amount = null;
                }
                else {
                    if(amount === '') {
                        amount = null;
                    }
                }
                
                let unitSource = null;
                if( payslipItems[i].importHoursCheckbox.getValue() ) unitSource = 'ATTE';
                
                earningItems.push({
                    code: payslipItems[i].itemTypeCode,
                    description: payslipItems[i].descriptionTxt.getValue(),
                    autoCalculate: payslipItems[i].itemAutoCheckbox.getValue(),
                    unitSourceCode: unitSource,
                    includeInNettPay: payslipItems[i].partOfNettPayCheckbox.getValue(), 
                    amount: amount,
                    isOnceOff: false,
                    categoryCode: payslipItems[i].categoryCode,
                    uniqueId: payslipItems[i].uniqueId
                });
            }
        }
        
        // Add new rfi items
        let found = false;
        for( let i = 0; i < providentFunds.length; i++ ) {
            if( providentFunds[i].subscribeCb.getValue() ) {
                for (let x = 0; x < earningItems.length; x++) {
                    found = false;
                    if (earningItems[x].categoryCode === 'INCO') {
                        for( let a = 0; a < providentFunds[i].rfiItems.length; a++ ) {
                            if( providentFunds[i].rfiItems[a].uniqueId === earningItems[x].uniqueId ) {
                                found = true;
                                break;
                            }
                        }
                        
                        if( !found && ( (typeof(providentFunds[i].rfiItemsEl) != 'undefined') && (providentFunds[i].rfiItemsEl != null) ) ) {
                            let rfiItems = null;
                            rfiItems = {
                                description: earningItems[x].description,
                                percentage: '100.000000',
                                payslipItemTypesCode: earningItems[x].code,
                                uniqueId: earningItems[x].uniqueId
                            };
                            addRfiItem( i, rfiItems, null, providentFunds[i].rfiItemsEl );
                        }
                    }
                }
            }
        }
        
        // Removes rfi items
        for (let i = 0; i < providentFunds.length; i++) {
            for( let a = 0; a < providentFunds[i].rfiItems.length; a++ ) {
                found = false;
                for (let x = 0; x < earningItems.length; x++) {
                    if( earningItems[x].categoryCode === 'INCO' ) {
                        if (earningItems[x].uniqueId === providentFunds[i].rfiItems[a].uniqueId) {
                            found = true;
                            break;
                        }
                    }
                }
                
                if( !found && ( (typeof(providentFunds[i].rfiItemsEl) != 'undefined') && (providentFunds[i].rfiItemsEl != null) ) ) {
                    if (providentFunds[i].rfiItemsEl.contains(providentFunds[i].rfiItems[a].el)) {
                        providentFunds[i].rfiItemsEl.removeChild(providentFunds[i].rfiItems[a].el);
                        providentFunds[i].rfiItems.splice(a, 1);
                    }
                }
                
            }
        }
    }
    
    // Function to load leave types
    function loadLeaveTypes() {
        leaveTypes = [];
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            data: {
                employeeId: config.employeeId
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    
                    return;
                }
                
                // Add leave type sections
                for( let i = 0; i < result.leaveTypes.length; i++ ) {
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: leaveTypeSectionEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            // maxWidth: '900px',
                            margin: '20px 0px 0px 0px',
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
                    subscribeCheckbox.setValue(false);
                    
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
                    
                    let messageContainer = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            padding: '10px 15px'
                            
                        },
                        innerHTML: 'The employee does not have any leave of this type.'
                    });
                    
                    subscribeCheckbox.addEventListener('click', subscribeCheckboxChangeEventHandler.bind(me, result.leaveTypes[i].id, messageContainer, subscribeCheckbox));
                    
                    let accruesHourly = false;
                    let accruesDaily = false;
                    for( let j = 0; j < result.leaveTypes[i].rules.length; j++ ) {
                        if( result.leaveTypes[i].rules[j].accrualType.code === 'HWOR' ) {
                            accruesHourly = true;
                        }
                        else if( result.leaveTypes[i].rules[j].accrualType.code === 'DWOR' ) {
                            accruesDaily = true;
                        }
                    }
                    
                    leaveTypes.push({
                        leaveTypeId: result.leaveTypes[i].id,
                        name: result.leaveTypes[i].name,
                        accruesHourly: accruesHourly,
                        accruesDaily: accruesDaily,
                        subscribeCheckboxEl: subscribeCheckbox,
                        typeContainerEl: typeContainerEl
                    });
                }
            }
        });
    }
    
    // Function to add employee
    function addEmployee() {
        // Disable buttons and show loader
        wizardNextBtn.showLoader();
        wizardNextBtn.disable();
        loader.show( false );
        
        // Get payslip items
        let recurringItems = [];
        for( let i = 0; i < payslipItems.length; i++ ) {
            if(payslipItems[i].itemTypeCode !== null) {
                let amount = lx.util.parseCurrency( payslipItems[i].itemAmountTxt.getValue() );
                if(payslipItems[i].itemAutoCheckbox.getValue() === true) {
                    amount = null;
                }
                else {
                    if(payslipItems[i].itemAmountTxt.getValue().trim() === '') {
                        amount = null;
                    }
                }
                    
                let unitSource = null;
                if( payslipItems[i].importHoursCheckbox.getValue() ) unitSource = 'ATTE';
                    
                recurringItems.push({
                    code: payslipItems[i].itemTypeCode,
                    description: payslipItems[i].descriptionTxt.getValue(),
                    autoCalculate: payslipItems[i].itemAutoCheckbox.getValue(),
                    unitSourceCode: unitSource,
                    includeInNettPay: payslipItems[i].partOfNettPayCheckbox.getValue(), 
                    amount: amount,
                    isOnceOff: false,
                    categoryCode: payslipItems[i].categoryCode,
                    uniqueId: payslipItems[i].uniqueId
                });
            }
        }
        
        // Get retirement fund items
        let retirmentFundItems = [];
        let rfiItems = null;
        for (var i = 0; i < providentFunds.length; i++) {
            if(providentFunds[i].subscribeCb.getValue()) {
                rfiItems = [];
                for (var x = 0; x < providentFunds[i].rfiItems.length; x++) {
                    if (providentFunds[i].rfiItems[x].selectedCb.getValue()) {
                        rfiItems.push({
                            uniqueId: providentFunds[i].rfiItems[x].uniqueId,
                            percentage: (lx.util.parseCurrency( providentFunds[i].rfiItems[x].percentageTxt.getValue() ) + ''),
                            payslipItemTypesCode: providentFunds[i].rfiItems[x].payslipItemTypesCode
                        });
                    }
                }
                retirmentFundItems.push({
                    providentFundId: parseInt(providentFunds[i].id),
                    rfiItems: rfiItems
                });
            }
        }
        
        // Get the leave items
        let leave = [];
        for( let i = 0; i < leaveTypes.length; i++ ) {
            if( !leaveTypes[i].subscribeCheckboxEl.getValue() ) {
                continue;
            }
            
            leave.push({
                leaveTypeId: leaveTypes[i].leaveTypeId,
                leaveItems: []
            });
        }
        
        let mondayValue = null;
        let tuesdayValue = null;
        let wednesdayValue = null;
        let thursdayValue = null;
        let fridayValue = null;
        let saturdayValue = null;
        let sundayValue = null;
        
        // Get all required values
        if( workScheduleCb.getValue() ) {
            if( mondayCb.getValue() ) {
                mondayValue = mondayHoursTxt.getValue();
            }
            
            if( tuesdayCb.getValue() ) {
                tuesdayValue = tuesdayHoursTxt.getValue();
            }
            
            if( wednesdayCb.getValue() ) {
                wednesdayValue = wednesdayHoursTxt.getValue();
            }
            
            if( thursdayCb.getValue() ) {
                thursdayValue = thursdayHoursTxt.getValue();
            }
            
            if( fridayCb.getValue() ) {
                fridayValue = fridayHoursTxt.getValue();
            }
            
            if( saturdayCb.getValue() ) {
                saturdayValue = saturdayHoursTxt.getValue();
            }
            
            if( sundayCb.getValue() ) {
                sundayValue = sundayHoursTxt.getValue();
            }
        }
        
        let workSchedule = {
            enableLeave: workScheduleCb.getValue(),
            mondayHours: parseInt(mondayValue),
            tuesdayHours: parseInt(tuesdayValue),
            wednesdayHours: parseInt(wednesdayValue),
            thursdayHours: parseInt(thursdayValue),
            fridayHours: parseInt(fridayValue),
            saturdayHours: parseInt(saturdayValue),
            sundayHours: parseInt(sundayValue)
        };
        
        // Add the employee
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=add',
            data: {
                code: codeTxt.getValue(),
                titleCode: titleSelect.getValue(),
                initials: initialsTxt.getValue().trim(),
                fullNames: fullNamesTxt.getValue().trim(),
                lastName: lastNameTxt.getValue().trim(),
                alias: aliasTxt.getValue().trim(),
                idNumber: idNumberTxt.getValue().replace(/\s/g,''),
                passportNumber: passportNumberTxt.getValue().trim(),
                passportCountry: passportCountrySelect.getValue(),
                dateOfBirth: dateOfBirthDate.getValue(),
                isAsylumSeeker: asylumSeekerCb.getValue(),
                isRefugee: refugeeCb.getValue(),
                isRetired: retiredCb.getValue(),
                employmentStartDate: employmentStartDate.getValue(),
                employmentPosition: employmentPositionTxt.getValue().trim(),
                departmentId: departmentSelect.getValue(),
                sendPayslipByEmail: true,
                paymentMethodCode: paymentMethodSelect.getValue(),
                paymentPeriodCode: paymentPeriodSelect.getValue(),
                paymentPeriodEndDay: parseInt(paymentPeriodEndDaySelect.getValue()),
                paymentDay: parseInt(paymentDaySelect.getValue()),
                incomeTaxNumber: incomeTaxNumberTxt.getValue().trim(),
                enablePayeCorrection: enablePayeCorrectionCb.getValue(),
                incomeTaxDirective1: incomeTaxDirective1Txt.getValue().trim(),
                incomeTaxDirective1IssuedOn: (incomeTaxDirective1IssuedOnDate.getValue() === '' ? null : incomeTaxDirective1IssuedOnDate.getValue()),
                incomeTaxDirective1SourceCode: incomeTaxDirective1SourceTxt.getValue().trim(),
                incomeTaxDirective1Amount: (incomeTaxDirective1AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective1AmountTxt.getValue().trim()),
                incomeTaxDirective2: incomeTaxDirective2Txt.getValue().trim(),
                incomeTaxDirective2IssuedOn: (incomeTaxDirective2IssuedOnDate.getValue() === '' ? null : incomeTaxDirective2IssuedOnDate.getValue()),
                incomeTaxDirective2SourceCode: incomeTaxDirective2SourceTxt.getValue().trim(),
                incomeTaxDirective2Amount: (incomeTaxDirective2AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective2AmountTxt.getValue().trim()),
                incomeTaxDirective3: incomeTaxDirective3Txt.getValue().trim(),
                incomeTaxDirective3IssuedOn: (incomeTaxDirective3IssuedOnDate.getValue() === '' ? null : incomeTaxDirective3IssuedOnDate.getValue()),
                incomeTaxDirective3SourceCode: incomeTaxDirective3SourceTxt.getValue().trim(),
                incomeTaxDirective3Amount: (incomeTaxDirective3AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective3AmountTxt.getValue().trim()),
                sicCode: sicCodeSelect.getValue(),
                emailAddress: emailAddressTxt.getValue().trim(),
                cellNumber: cellNumberTxt.getValue().trim(),
                homeNumber: homeNumberTxt.getValue().trim(),
                workNumber: workNumberTxt.getValue().trim(),
                faxNumber: faxNumberTxt.getValue().trim(),
                emergencyContactPerson: emergencyContactPersonTxt.getValue().trim(),
                emergencyContactNumber: emergencyContactNumberTxt.getValue().trim(),
                physicalAddressUnit: physicalAddressUnitTxt.getValue().trim(),
                physicalAddressComplex: physicalAddressComplexTxt.getValue().trim(),
                physicalAddressStreet: physicalAddressStreetTxt.getValue().trim(),
                physicalAddressSuburb: physicalAddressSuburbTxt.getValue().trim(),
                physicalAddressCity: physicalAddressCityTxt.getValue().trim(),
                physicalAddressPostalCode: physicalAddressPostalCodeTxt.getValue().trim(),
                physicalAddressCountryCode: physicalAddressCountrySelect.getValue(),
                postalSameAsPhysical: postalAddressCb.getValue(),
                postalAddressLine1: postalAddressLine1Txt.getValue().trim(),
                postalAddressLine2: postalAddressLine2Txt.getValue().trim(),
                postalAddressLine3: postalAddressLine3Txt.getValue().trim(),
                postalAddressCode: postalAddressCodeTxt.getValue().trim(),
                postalAddressCountryCode: postalAddressCountrySelect.getValue(),
                useCompanyWorkAddress: useCompanyWorkAddressCb.getValue(),
                workAddressUnit: workAddressUnitTxt.getValue().trim(),
                workAddressComplex: workAddressComplexTxt.getValue().trim(),
                workAddressStreet: workAddressStreetTxt.getValue().trim(),
                workAddressSuburb: workAddressSuburbTxt.getValue().trim(),
                workAddressCity: workAddressCityTxt.getValue().trim(),
                workAddressPostalCode: workAddressPostalCodeTxt.getValue().trim(),
                workAddressCountryCode: workAddressCountrySelect.getValue(),
                bankDetails: {
                    financialInstitution: {
                        code: bankDetailsInsitutionSelect.getValue()
                    },
                    accountType: {
                        code: bankDetailsAccountTypeRadio.getValue()
                    },
                    accountNumber: bankDetailsAccountNumberTxt.getValue().trim(),
                    branchCode: bankDetailsBranchCodeTxt.getValue().trim()
                },
                payslipItems: recurringItems,
                retirmentFundItems: retirmentFundItems,
                leave: leave,
                workSchedule: workSchedule
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Adding Employee Failed',
                        message: response.error
                    });
                    
                    loader.hide();
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    return;
                }
                
                // Fire the finish event
                me.fireEvent('finish', {srcPanel: me});
            }
        });
    }
    
    
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
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                margin: '0px 0px',
                overflow: 'auto',
                // backgroundColor: 'RGB( 0, 0, 0, 0.5)'
            }
        });
        
        // Create the content container
        mainContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flex: '1 1 100%',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                // maxWidth: '980px',
                // maxHeight: '800px',
                // margin: '40px auto',
                overflow: 'auto',
                // boxShadow: '3px 3px 6px 2px RGB(0, 0, 0, 0.5)'
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: mainContainerEl,
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
            innerHTML: '<i class="fa fa-fw fa-user-plus" style="margin: 0px 15px 0px 0px;"></i>Add Employee'
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: mainContainerEl,
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
                'Employee Details (' + pageNum + '/' + numPages + ')'
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
                backgroundColor: sectionBackgroundColor, // lx.style.global.backgroundColor,
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
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
                fontSize: '32px'
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
                'Please complete the employee&apos;s personal, employment, and tax details below, ensuring that the information ' +
                'is accurate and up-to-date. ' // + 
                // 'Note that the &apos;Tax Details&apos;, &apos;SARS Contact Person&apos;, and &apos;UIF Contact Person&apos; ' + 
                // 'sections are required for integration with SARS e@syFile&trade;.'
        });
        
        // Personal details section
        personalDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Personal Details</div>'
        });
        
        personalDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        codeTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Code *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onChange: codeTxtChangeEventHandler
        });
        
        let titleSelectContainerEl = lx.createElement('DIV', {
            parent: personalDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        titleSelect = new lx.component.Selectbox({
            renderTo: titleSelectContainerEl,
            label: 'Title *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function( value ) {
                    if( value === null ) {
                        titleSelectValidatorEl.style.display = 'flex';
                        return false;
                    }
                    
                    titleSelectValidatorEl.style.display = 'none';
                    return true;
                }
            ],
            
            onChange: defaultOnChangeEventHandler
        });
        
        let titleSelectValidatorEl = lx.createElement('DIV', {
            parent: titleSelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                titleSelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                titleSelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let titleSelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: titleSelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let titleSelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: titleSelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        initialsTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Initials *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onChange: defaultOnChangeEventHandler
        });
        
        fullNamesTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Full Names *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onChange: function() {
                aliasTxt.setValue( fullNamesTxt.getValue().split(' ')[0] );
                formChanged = true;
            }
        });
        
        lastNameTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Last Name *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onChange: defaultOnChangeEventHandler
        });
        
        aliasTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Alias *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onChange: defaultOnChangeEventHandler
        });
        
        idNumberTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'ID Number *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( (value.trim() === '') && (passportNumberTxt.getValue().trim() === '') ) {
                        return 'Value is required if no passport number is specified';
                    }
                    
                    return true;
                }
            ],
            
            onBlur: function() {
                idNumberTxt.validate();
            },
            
            onChange: idNumberTxtChangeEventHandler
        });
        
        passportNumberTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Passport Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    if( (value === '') && (idNumberTxt.getValue().trim() === '')) {
                        return 'Value is required if no ID number is specified';
                    }
                    
                    return true;
                }
            ],
            
            onBlur: function() {
                idNumberTxt.validate();
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let passportCountrySelectContainerEl = lx.createElement('DIV', {
            parent: personalDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        passportCountrySelect = new lx.component.Selectbox({
            renderTo: passportCountrySelectContainerEl,
            label: 'Passport Country',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            validators: [
                // Make certian it's a valid value
                function( value ) {
                    if( (value === null) && (passportNumberTxt.getValue().trim() !== '') ) {
                        passportCountrySelectValidatorEl.style.display = 'flex';
                        return false;
                    }
                    
                    passportCountrySelectValidatorEl.style.display = 'none';
                    return true;
                }
            ],
            
            onSearch: function() {
                passportCountrySelect.clear();
                loadCountries( passportCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( passportCountrySelect );
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let passportCountrySelectValidatorEl = lx.createElement('DIV', {
            parent: passportCountrySelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                passportCountrySelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                passportCountrySelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let passportCountrySelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: passportCountrySelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let passportCountrySelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: passportCountrySelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required if a passport number is specified'
        });
        
        let dateOfBirthDateContainerEl = lx.createElement('DIV', {
            parent: personalDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        dateOfBirthDate = new lx.component.DateSelect({
            renderTo: dateOfBirthDateContainerEl,
            label: 'Date Of Birth *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onBlur: function() {
                // Make certian it's a valid value
                if( dateOfBirthDate.getValue() === null ) {
                    dateOfBirthDateValidatorEl.style.display = 'flex';
                    return;
                }
                
                dateOfBirthDateValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let dateOfBirthDateValidatorEl = lx.createElement('DIV', {
            parent: dateOfBirthDateContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                dateOfBirthDateValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                dateOfBirthDateValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let dateOfBirthDateValidatorTooltipLocus = lx.createElement('DIV', {
            parent: dateOfBirthDateContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let dateOfBirthDateValidatorTooltip = new lx.component.Tooltip({
            renderTo: dateOfBirthDateValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        asylumSeekerCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            label: 'Asylum Seeker',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        refugeeCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            label: 'Refugee',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        retiredCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            label: 'Retired',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        // Employment details section
        employmentDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Employment Details</div>'
        });
        
        employmentDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        let employmentStartDateContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        employmentStartDate = new lx.component.DatePicker({
            renderTo: employmentStartDateContainerEl,
            label: 'Employment Date *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onBlur: function() {
                // Make certian it's a valid value
                if( employmentStartDate.getValue().trim() === '' ) {
                    employmentStartDateValidatorEl.style.display = 'flex';
                    return;
                }
                
                employmentStartDateValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let employmentStartDateValidatorEl = lx.createElement('DIV', {
            parent: employmentStartDateContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                employmentStartDateValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                employmentStartDateValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let employmentStartDateValidatorTooltipLocus = lx.createElement('DIV', {
            parent: employmentStartDateContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let employmentStartDateValidatorTooltip = new lx.component.Tooltip({
            renderTo: employmentStartDateValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        employmentPositionTxt = new lx.component.Textbox({
            renderTo: employmentDetailsSectionEl,
            label: 'Employment Position',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
       departmentSectionEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '15px 0px 0px 0px',
                alignItems: 'center',
                width: '100%'
            }
        });
        
        departmentSelect = new lx.component.Selectbox({
            renderTo: departmentSectionEl,
            label: 'Department',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        addDepartmentBtn = new lx.component.Button({
            renderTo: departmentSectionEl,
            label: 'Add',
            margin: '0px 0px 0px 15px',
            style: 'text',
            
            onClick: addDepartmentBtnClickEventHandler
        });
        
        let paymentMethodSelectContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        paymentMethodSelect = new lx.component.Selectbox({
            renderTo: paymentMethodSelectContainerEl,
            label: 'Payment Method *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            // validators: [
            //     // Make certian it's a valid value
            //     function(value) {
            //         if( value === null ) {
            //             return 'Value is required';
            //         }
            //         return true;
            //     }
            // ],
            
            onBlur: function() {
                // Make certian it's a valid value
                if( paymentMethodSelect.getValue() === null ) {
                    paymentMethodSelectValidatorEl.style.display = 'flex';
                    return;
                }
                
                paymentMethodSelectValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let paymentMethodSelectValidatorEl = lx.createElement('DIV', {
            parent: paymentMethodSelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                paymentMethodSelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                paymentMethodSelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let paymentMethodSelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: paymentMethodSelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let paymentMethodSelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: paymentMethodSelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        let paymentPeriodSelectContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        paymentPeriodSelect = new lx.component.Selectbox({
            renderTo: paymentPeriodSelectContainerEl,
            label: 'Payment Period *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            // validators: [
            //     // Make certian it's a valid value
            //     function(value) {
            //         if( value === null ) {
            //             return 'Value is required';
            //         }
            //         return true;
            //     }
            // ],
            
            onBlur: function() {
                // Make certian it's a valid value
                if( paymentPeriodSelect.getValue() === null ) {
                    paymentPeriodSelectValidatorEl.style.display = 'flex';
                    return;
                }
                
                paymentPeriodSelectValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: paymentPeriodSelectChangeEventHandler
        });
        
        let paymentPeriodSelectValidatorEl = lx.createElement('DIV', {
            parent: paymentPeriodSelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                paymentPeriodSelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                paymentPeriodSelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let paymentPeriodSelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: paymentPeriodSelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let paymentPeriodSelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: paymentPeriodSelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        let paymentPeriodEndDaySelectContainerEl = new lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '15px 0px 0px 0px'
            }
        });
        
        paymentPeriodEndDaySelect = new lx.component.Selectbox({
            renderTo: paymentPeriodEndDaySelectContainerEl,
            label: 'Payment Period End Day *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '600px',
            
            // validators: [
            //     // Make certian it's a valid value
            //     function(value) {
            //         if( value === null ) {
            //             return 'Value is required';
            //         }
            //         return true;
            //     }
            // ],
            
            onBlur: function() {
                // Make certian it's a valid value
                if( paymentPeriodEndDaySelect.getValue() === null ) {
                    paymentPeriodEndDaySelectValidatorEl.style.display = 'flex';
                    return;
                }
                
                paymentPeriodEndDaySelectValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let paymentPeriodEndDayInfoEl = new lx.createElement('DIV', {
            parent: paymentPeriodEndDaySelectContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        let paymentPeriodEndDayTooltipLocusEl = lx.createElement('DIV', {
            parent: paymentPeriodEndDaySelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let paymentPeriodEndDayInfoTooltip = new lx.component.Tooltip({
            renderTo: paymentPeriodEndDayTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '480px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'The payment period end day indicates the last day of the billing/work cycle. For example:<br><br>' +
                    'If the payment period end day is the last day of the month, the employee&apos;s payslip will start on the 1st day of the month and end on the last day. The payslip for March, for example, will start on 1 March and end on 31 March.<br><br>' +
                    'If the payment period end day is the 25th of the month, the employee&apos;s payslip will start on the 26th day of the previous month and end on the 25th of the payslip month. The payslip for March, for example, will start on 26 February and end on 25 March.' +
                '</span>'
        });
        paymentPeriodEndDayInfoEl.addEventListener('mouseenter', function() { paymentPeriodEndDayInfoTooltip.show(); });
        paymentPeriodEndDayInfoEl.addEventListener('mouseleave', function() { paymentPeriodEndDayInfoTooltip.hide(); });
        
        let paymentPeriodEndDaySelectValidatorEl = lx.createElement('DIV', {
            parent: paymentPeriodEndDaySelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                paymentPeriodEndDaySelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                paymentPeriodEndDaySelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let paymentPeriodEndDaySelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: paymentPeriodEndDaySelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let paymentPeriodEndDaySelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: paymentPeriodEndDaySelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        let paymentDaySelectContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        paymentDaySelect = new lx.component.Selectbox({
            renderTo: paymentDaySelectContainerEl,
            label: 'Payment Day *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            // validators: [
            //     // Make certian it's a valid value
            //     function(value) {
            //         if( value === null ) {
            //             return 'Value is required';
            //         }
            //         return true;
            //     }
            // ],
            
            onBlur: function() {
                // Make certian it's a valid value
                if( paymentDaySelect.getValue() === null ) {
                    paymentDaySelectValidatorEl.style.display = 'flex';
                    return;
                }
                
                paymentDaySelectValidatorEl.style.display = 'none';
                return;
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let paymentDaySelectValidatorEl = lx.createElement('DIV', {
            parent: paymentDaySelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                paymentDaySelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                paymentDaySelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let paymentDaySelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: paymentDaySelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let paymentDaySelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: paymentDaySelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        // Tax details section
        taxDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Income Tax Details</div>'
        });
        
        taxDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        incomeTaxNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            label: 'Income Tax Number',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        let sicCodeSelectContainerEl = lx.createElement('DIV', {
            parent: taxDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                width: '100%'
            }
        });
        
        sicCodeSelect = new lx.component.Selectbox({
            renderTo: sicCodeSelectContainerEl,
            label: 'SIC Code *',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            // validators: [
            //     // Make certian it's a valid value
            //     function(value) {
            //         if( value === null ) {
            //             return 'Value is required';
            //         }
            //         return true;
            //     }
            // ],
            
            onBlur: function() {
                // Make certian it's a valid value
                if( sicCodeSelect.getValue() === null ) {
                    sicCodeSelectValidatorEl.style.display = 'flex';
                    return;
                }
                
                sicCodeSelectValidatorEl.style.display = 'none';
                return;
            },
            
            onSearch: function() {
                sicCodeSelect.clear();
                loadSicCodes();
            },
            
            onListScrollEnd: function() {
                loadSicCodes();
            },
            
            onChange: defaultOnChangeEventHandler
        });
        
        let sicCodeSelectValidatorEl = lx.createElement('DIV', {
            parent: sicCodeSelectContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                width: '22px',
                margin: 'auto 0px 7px 10px',
                color: '#DF4241',
                fontSize: '14px'
            },
            
            onmouseenter: function() {
                sicCodeSelectValidatorTooltip.show();
            },
            
            onmouseleave: function() {
                sicCodeSelectValidatorTooltip.hide();
            },
            
            innerHTML: warningIconEl
        });
        
        let sicCodeSelectValidatorTooltipLocus = lx.createElement('DIV', {
            parent: sicCodeSelectContainerEl,
            style: {
                position: 'relative',
                margin: 'auto auto 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        let sicCodeSelectValidatorTooltip = new lx.component.Tooltip({
            renderTo: sicCodeSelectValidatorTooltipLocus,
            alignment: 'topRight',
            color: '#FFFFFF',
            backgroundColor: '#E75B54',
            arrowOffset: '9px',
            message: 'Value is required'
        });
        
        enablePayeCorrectionCb = new lx.component.Checkbox({
            renderTo: taxDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Enable Year-end PAYE Correction *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '600px',
            isChecked: true
        });
        
        // Tax directive 1 section
        taxDirective1HeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Income Tax Directive 1</div>'
        });
        
        taxDirective1SectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        incomeTaxDirective1Txt = new lx.component.Textbox({
            renderTo: taxDirective1SectionEl,
            label: 'Number',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective1IssuedOnDate = new lx.component.DatePicker({
            renderTo: taxDirective1SectionEl,
            label: 'Issued On',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective1SourceTxt = new lx.component.Textbox({
            renderTo: taxDirective1SectionEl,
            label: 'Source Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective1AmountTxt = new lx.component.Textbox({
            renderTo: taxDirective1SectionEl,
            label: 'Amount',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        // Tax directive 2 section
        taxDirective2HeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Income Tax Directive 2</div>'
        });
        
        taxDirective2SectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        incomeTaxDirective2Txt = new lx.component.Textbox({
            renderTo: taxDirective2SectionEl,
            label: 'Number',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective2IssuedOnDate = new lx.component.DatePicker({
            renderTo: taxDirective2SectionEl,
            label: 'Issued On',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective2SourceTxt = new lx.component.Textbox({
            renderTo: taxDirective2SectionEl,
            label: 'Source Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective2AmountTxt = new lx.component.Textbox({
            renderTo: taxDirective2SectionEl,
            label: 'Amount',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        // Tax directive 3 section
        taxDirective3HeadingEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Income Tax Directive 3</div>'
        });
        
        taxDirective3SectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        incomeTaxDirective3Txt = new lx.component.Textbox({
            renderTo: taxDirective3SectionEl,
            label: 'Number',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective3IssuedOnDate = new lx.component.DatePicker({
            renderTo: taxDirective3SectionEl,
            label: 'Issued On',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective3SourceTxt = new lx.component.Textbox({
            renderTo: taxDirective3SectionEl,
            label: 'Source Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        incomeTaxDirective3AmountTxt = new lx.component.Textbox({
            renderTo: taxDirective3SectionEl,
            label: 'Amount',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
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
                fontSize: '32px'
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
                'Please complete the employee&apos;s contact, address, and bank details below.'
        });
        
        // Contact details section
        contactDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '15px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Contact Details</div>'
        });
        
        contactDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        emailAddressTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Email Address',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        cellNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Cell Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        homeNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Home Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Work Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        faxNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Fax Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        emergencyContactPersonTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Emergency Contact Person',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        emergencyContactNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Emergency Contact Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        // Physical address section
        physicalAddressHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Physical Address</div>'
        });
        
        physicalAddressSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        physicalAddressUnitTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Unit',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressComplexTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Complex',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressStreetTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Street',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressSuburbTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Suburb',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressCityTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'City',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Postal Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        physicalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: physicalAddressSectionEl,
            label: 'Country',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            onSearch: function() {
                physicalAddressCountrySelect.clear();
                loadCountries( physicalAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( physicalAddressCountrySelect );
            },
            
            onChange: defaultOnChangeEventHandler
        });
        loadCountries( physicalAddressCountrySelect );
        physicalAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        // Postal address section
        postalAddressHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Postal Address</div>'
        });
        
        postalAddressSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        postalAddressCb = new lx.component.Checkbox({
            renderTo: postalAddressSectionEl,
            label: 'Use physical address',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            isChecked: true,
            
            onChange: postalAddressCbChangeEventHandler
        });
        
        postalAddressContainerEl = lx.createElement('DIV', {
            parent: postalAddressSectionEl,
            style: {
                display: 'none'
            }
        });
        
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 1',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 2',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 3',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        postalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: postalAddressContainerEl,
            label: 'Country',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            onSearch: function() {
                postalAddressCountrySelect.clear();
                loadCountries( postalAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( postalAddressCountrySelect );
            },
            
            onChange: defaultOnChangeEventHandler
        });
        loadCountries( postalAddressCountrySelect );
        postalAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        // Work address section
        workAddressHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Work Address</div>'
        });
        
        workAddressSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        useCompanyWorkAddressCb = new lx.component.Checkbox({
            renderTo: workAddressSectionEl,
            label: 'Use the company address',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            isChecked: true,
            
            onChange: useCompanyWorkAddressCbChangeEventHandler
        });
        
        workAddressContainerEl = lx.createElement('DIV', {
            parent: workAddressSectionEl,
            style: {
                display: 'none'
            }
        });
        
        workAddressUnitTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'Unit',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressComplexTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'Complex',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressStreetTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'Street',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressSuburbTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'Suburb',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressCityTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'City',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            label: 'Postal Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        workAddressCountrySelect = new lx.component.Selectbox({
            renderTo: workAddressContainerEl,
            label: 'Country',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            onSearch: function() {
                workAddressCountrySelect.clear();
                loadCountries( workAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( workAddressCountrySelect );
            },
            
            onChange: defaultOnChangeEventHandler
        });
        loadCountries( workAddressCountrySelect );
        workAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        // Bank details section
        bankDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Bank Details</div>'
        });
        
        bankDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        bankDetailsInsitutionSelect = new lx.component.Selectbox({
            renderTo: bankDetailsSectionEl,
            label: 'Financial Institution',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        bankDetailsAccountTypeRadio = new lx.component.RadioGroup({
            renderTo: bankDetailsSectionEl,
            label: 'Account Type',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            items: app.commonSelectOptions.bankAccountTypes,
            
            onChange: defaultOnChangeEventHandler
        });
        
        bankDetailsAccountNumberTxt = new lx.component.Textbox({
            renderTo: bankDetailsSectionEl,
            label: 'Account Number',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        bankDetailsBranchCodeTxt = new lx.component.Textbox({
            renderTo: bankDetailsSectionEl,
            label: 'Branch Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            onChange: defaultOnChangeEventHandler
        });
        
        
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
        let page3NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
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
            parent: page3NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page3NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'Setup the payslip items which will appear on every payslip of the employee. Some default items have been added ' + 
                'to facilitate the process. You can add new items by selecting an item to add from the list below or remove ' + 
                'items by clicking on the red icon on the right of the item.'
        });
        
        // Recurring items section
        new lx.component.Heading({
            renderTo: wizardPage3ContainerEl,
            label: 'Recurring Payslip Items',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            // maxWidth: '900px',
            padding: '15px 15px 0px 15px',
            fontSize: '16px'
        });
        
        payslipItemSectionEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                // width: '100%',
                // maxWidth: '900px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        addPayslipItemContainerEl = lx.createElement('DIV', {
            parent: payslipItemSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '0px 0px 0px 0px',
                padding: '0px 0px 15px 0px',
                // backgroundColor: sectionBackgroundColor,
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px'
            }
        });
        
        addPayslipItemSelect = new lx.component.Selectbox({
            renderTo: addPayslipItemContainerEl,
            // label: 'Add Item',
            // labelAlign: 'left',
            // labelWidth: '220px',
            maxWidth: '550px',
            search: true,
            placeHolderText: 'Click here to select a payslip item to add',
            
            onSearch: addPayslipItemSelectSearchEventHandler,
            onChange: addPayslipItemSelectChangeEventHandler
        });
        
        // restoreDefaultPayslipItemsBtn = new lx.component.Button({
        //     renderTo: addPayslipItemContainerEl,
        //     label: 'Restore Defaults',
        //     width: '100%',
        //     maxWidth: '140px',
        //     margin: '0px 0px 0px auto',
            
        //     // onClick: restoreDefaultPayslipItemsBtnClickEventHandler
        // });
        
        paylsipItemContainerEl = lx.createElement('DIV', {
            parent: payslipItemSectionEl,
            style: {
                width: '100%',
                // border: '2px solid red'
            }
        });
        
        
        //
        // WIZARD PAGE 4
        //
        
        wizardPage4ContainerEl = lx.createElement('DIV', {
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
        let page4NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage4ContainerEl,
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
            parent: page4NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page4NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'Please select the retirement fund(s) the employee is subscribed to (if any) by checking the box next to the ' + 
                'retirement fund name. If no retirement funds are listed please setup your retirement funds by selecting the ' + 
                '&quot;Setup&quot; option in the main menu and going to the &quot;Retirement Fund Setup&quot; section.'
        });
        
        providentFundSectionEl = lx.createElement('DIV', {
            parent: wizardPage4ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px 0px',
                // width: '100%',
                // maxWidth: '900px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        // // Display the heading
        // new lx.component.Heading({
        //     renderTo: wizardPage4ContainerEl,
        //     label: 'Retirement Funds',
        //     boxSizing: 'border-box',
        //     display: 'flex',
        //     flexDirection: 'row',
        //     alignItems: 'center',
        //     justifyContent: 'space-between',
        //     width: '100%',
        //     maxWidth: '900px',
        //     padding: '15px 15px 0px 0px',
        //     fontSize: '16px'
        // });
        
        
        //
        // WIZARD PAGE 5
        //
        
        wizardPage5ContainerEl = lx.createElement('DIV', {
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
        let page5NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage5ContainerEl,
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
            parent: page5NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page5NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'Please select the leave types the employee is subscribed to (if any) by checking the box next to the ' + 
                'leave type name. If no leave types are listed please setup your leave types by selecting the ' + 
                '&quot;Setup&quot; option in the main menu and going to the &quot;Leave Setup&quot; section.'
        });
        
        leaveTypeSectionEl = lx.createElement('DIV', {
            parent: wizardPage5ContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px 0px',
                // width: '100%',
                // maxWidth: '900px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        // // Display the heading
        // new lx.component.Heading({
        //     renderTo: wizardPage4ContainerEl,
        //     label: 'Leave Types',
        //     boxSizing: 'border-box',
        //     display: 'flex',
        //     flexDirection: 'row',
        //     alignItems: 'center',
        //     justifyContent: 'space-between',
        //     width: '100%',
        //     maxWidth: '900px',
        //     padding: '15px 15px 0px 0px',
        //     fontSize: '16px'
        // });
        
        
        //
        // WIZARD PAGE 6
        //
        
        wizardPage6ContainerEl = lx.createElement('DIV', {
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
                backgroundColor: pageBackgroundColor, // lx.style.global.backgroundColor,
                padding: pagePadding,
                overflow: 'auto'
            }
        });
        
        // Display a message to the user
        let page6NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage6ContainerEl,
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
            parent: page6NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page6NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'The work schedule is used to calculate leave for employees where leave is earned on the number of days worked. ' + 
                'Please DO NOT select to use the work schedule for employees who receive a daily wage since the leave will be ' + 
                'calculated on the number of days specified on the payslip instead.'
        });
        
        // Display the wheading
        // wnew lx.createElement('DIV', {
        //     parent: wizardPage6ContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         alignItems: 'center',
        //         justifyContent: 'space-between',
        //         width: '100%',
        //         maxWidth: '900px',
        //         padding: '15px 15px 15px 15px',
        //         fontSize: '16px'
        //     },
        //     innerHTML: '<div>Work Schedule</div>'
        // });
        
        // Create the workScheduleSectionEl element
        workScheduleSectionEl = lx.createElement('DIV', {
            parent: wizardPage6ContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 0px 0px 0px',
                padding: '15px'
            }
        });
        
        workScheduleCb = new lx.component.Checkbox({
            renderTo: workScheduleSectionEl,
            label: 'Use work schedule',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            isChecked: false,
            
            onChange: workScheduleCbChangeEventHandler
        });
        
        workScheduleContainerEl = lx.createElement('DIV', {
            parent: workScheduleSectionEl,
            style: {
                display: 'none'
            }
        });
        
        mondayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                margin: '20px 0px 0px 0px'
            }
        });
        mondayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        mondayCb = new lx.component.Checkbox({
            renderTo: mondayContainer,
            margin: '0px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Monday',
            width: '220px',
            
            onChange: mondayCbOnChangeEventHandler
        });
        
        mondayHoursTxt = new lx.component.Textbox({
            renderTo: mondayContainer,
            margin: '0px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        mondayHoursTxt.disable();
        
        mondayHoursLabel = new lx.component.Label({
            renderTo: mondayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        tuesdayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        tuesdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        tuesdayCb = new lx.component.Checkbox({
            renderTo: tuesdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Tuesday',
            width: '220px',
            
            onChange: tuesdayCbOnChangeEventHandler
        });
        
        tuesdayHoursTxt = new lx.component.Textbox({
            renderTo: tuesdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        tuesdayHoursTxt.disable();
        
        tuesdayHoursLabel = new lx.component.Label({
            renderTo: tuesdayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        wednesdayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        wednesdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        wednesdayCb = new lx.component.Checkbox({
            renderTo: wednesdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Wednesday',
            width: '220px',
            
            onChange: wednesdayCbOnChangeEventHandler
        });
        
        wednesdayHoursTxt = new lx.component.Textbox({
            renderTo: wednesdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        wednesdayHoursTxt.disable();
        
        wednesdayHoursLabel = new lx.component.Label({
            renderTo: wednesdayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        thursdayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        thursdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        thursdayCb = new lx.component.Checkbox({
            renderTo: thursdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Thursday',
            width: '220px',
            
            onChange: thursdayCbOnChangeEventHandler
        });
        
        thursdayHoursTxt = new lx.component.Textbox({
            renderTo: thursdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        thursdayHoursTxt.disable();
        
        thursdayHoursLabel = new lx.component.Label({
            renderTo: thursdayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        fridayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        fridayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        fridayCb = new lx.component.Checkbox({
            renderTo: fridayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Friday',
            width: '220px',
            
            onChange: fridayCbOnChangeEventHandler
        });
        
        fridayHoursTxt = new lx.component.Textbox({
            renderTo: fridayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        fridayHoursTxt.disable();
        
        fridayHoursLabel = new lx.component.Label({
            renderTo: fridayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        saturdayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        saturdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        saturdayCb = new lx.component.Checkbox({
            renderTo: saturdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Saturday',
            width: '220px',
            
            onChange: saturdayCbOnChangeEventHandler
        });
        
        saturdayHoursTxt = new lx.component.Textbox({
            renderTo: saturdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        saturdayHoursTxt.disable();
        
        saturdayHoursLabel = new lx.component.Label({
            renderTo: saturdayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
        });
        
        sundayContainer = lx.createElement('DIV', {
            parent: workScheduleContainerEl,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        sundayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        sundayCb = new lx.component.Checkbox({
            renderTo: sundayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label:' Sunday',
            width: '220px',
            
            onChange: sundayCbOnChangeEventHandler
        });
        
        sundayHoursTxt = new lx.component.Textbox({
            renderTo: sundayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px',
            textAlign: 'right',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value, 0));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onChange: defaultOnChangeEventHandler
        });
        sundayHoursTxt.disable();
        
        sundayHoursLabel = new lx.component.Label({
            renderTo: sundayContainer,
            text: 'hours',
            padding: '0px 0px 0px 10px'
            
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
                backgroundColor: lx.style.global.backgroundColor, // sectionBackgroundColor
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 1px 0px'
            }
        });
        
        // Create the wizardCancelBtn component
        wizardCancelBtn = new lx.component.Button({
            renderTo: wizardButtonContainerEl,
            label: '<i class="far fa-window-close" style="margin: 0px 10px 0px 0px;"></i>Cancel',
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
        
        // Load wizard data
        loadTitles();
        loadDepartments(null, 'None');
        loadPaymentMethods();
        loadPaymentPeriods();
        loadCountries([
            passportCountrySelect
        ]);
        loadSicCodes();
        loadDefaultSicCode();
        loadFinancialInstitutions( bankDetailsInsitutionSelect );
        loadPayslipItemTypes( addPayslipItemSelect );
        loadProvidentFunds();
        loadLeaveTypes();
        
        // Load the next available employee code
        loader.show( false );
        getNextEmployeeCode(function() {
            loader.hide();
            me.focus();
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
        codeTxt.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // wizardCancelBtn click event handler
    function wizardCancelBtnClickEventHandler() {
        // Fire the cancel event
        // console.log("cancel event has been triggered")
        me.fireEvent('cancel', {srcPanel: me, formChanged: formChanged});
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
            wizardHeadingEl.innerHTML = 'Employee Details (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage1ContainerEl.style.display = 'flex';
            wizardPage2ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Disable the previous button
            wizardPreviousBtn.disable();
            
            // Focus on the relevant component
            codeTxt.focus();
        }
        else if( pageNum === 3 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Employee Details (Continued) (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage2ContainerEl.style.display = 'flex';
            wizardPage3ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Focus on the relevant component
            emailAddressTxt.focus();
        }
        else if( pageNum === 4 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Payslip Items (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage3ContainerEl.style.display = 'flex';
            wizardPage4ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Focus on the relevant component
            addPayslipItemSelect.focus();
        }
        else if( pageNum === 5 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Retirement Funds (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage4ContainerEl.style.display = 'flex';
            wizardPage5ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Focus on the relevant component
            if( providentFunds.length > 0 ) {
                providentFunds[0].subscribeCb.setFocus();
            }
        }
        else if( pageNum === 6 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Leave (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage5ContainerEl.style.display = 'flex';
            wizardPage6ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Focus on the relevant component
            if( leaveTypes.length > 0 ) {
                leaveTypes[0].subscribeCheckboxEl.setFocus();
            }
        }
    }
    
    // wizardNextBtn click event handler
    function wizardNextBtnClickEventHandler() {
        // Scroll to the top of the section
        wizardSectionEl.scrollTop = 0;
        
        // Depending on the page we're on
        if( pageNum === 1 ) {
            // Do sanity checks
            if( titleSelect.getValue() === null ) {
                wizardNextBtn.showWarning('The employee title can not be empty.');
                return;
            }
            else if( initialsTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('The employee initials can not be empty.');
                return;
            }
            else if( fullNamesTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('The employee first name can not be empty.');
                return;
            }
            else if( lastNameTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('The employee last name can not be empty.');
                return;
            }
            else if( aliasTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('The employee alias can not be empty.');
                return;
            }
            else if( idNumberTxt.getValue().trim() === '' && passportNumberTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('The employee must have either an id number or passport number.');
                return;
            }
            else if( (idNumberTxt.getValue().trim() !== '') && (lx.util.validateSouthAfricanId(idNumberTxt.getValue().trim()).error == true) ) {
                wizardNextBtn.showWarning(lx.util.validateSouthAfricanId(idNumberTxt.getValue().trim()).errorMessage);
                return;
            }
            else if( passportNumberTxt.getValue().trim() !== '' && passportCountrySelect.getValue() === null ) {
                wizardNextBtn.showWarning('The passport country is required if a passport number was specified.');
                return;
            }
            else if( dateOfBirthDate.getValue() === '' || dateOfBirthDate.getValue() === null) {
                wizardNextBtn.showWarning('The employee date of birth can not be empty.');
                return;
            }
            else if( employmentStartDate.getValue() === '' || employmentStartDate.getValue() === null) {
                wizardNextBtn.showWarning('The employment date can not be empty.');
                return;
            }
            else if( paymentMethodSelect.getValue() === null ) {
                wizardNextBtn.showWarning('The payment method can not be empty.');
                return;
            }
            else if( paymentPeriodSelect.getValue() === null ) {
                wizardNextBtn.showWarning('The payment period can not be empty.');
                return;
            }
            else if( paymentPeriodEndDaySelect.getValue() === null ) {
                wizardNextBtn.showWarning('The payment period end day can not be empty.');
                return;
            }
            else if( paymentDaySelect.getValue() === null ) {
                wizardNextBtn.showWarning('The payment day can not be empty.');
                return;
            }
            if( sicCodeSelect.getValue() === null ) {
                wizardNextBtn.showWarning('The SIC code can not be empty.');
                return;
            }
            
            // Was no tax income number specified?
            if( incomeTaxNumberTxt.getValue().trim() === '' ) {
                new lx.component.Messagebox({
                    title: '<i class="fas fa-exclamation-triangle" style="margin: 0px 15px 0px 0px;"></i>No income tax number specified',
                    message: 
                        'The income tax reference number is a mandatory field on the tax certificate ' + 
                        'returns made by employers, therefore you will not be able to submit your tax ' + 
                        'reconciliations to SARS unless you obtain an income tax reference number for ' + 
                        'the employee.<br><br>' + 
                        'Are you certain you wish to continue?',
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'continue', label: 'Continue', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'continue' ) {
                            // Disable buttons and show loader
                            wizardNextBtn.showLoader();
                            wizardNextBtn.disable();
                            loader.show( false );
                            
                            // Update the page number and heading
                            pageNum++;
                            wizardHeadingEl.innerHTML = 'Employee Details (Continued) (' + pageNum + '/' + numPages+ ')';
                            
                            // Display the next page
                            wizardPage1ContainerEl.style.display = 'none';
                            wizardPage2ContainerEl.style.display = 'flex';
                            
                            // Enable the previous button
                            wizardPreviousBtn.enable();
                            
                            // Change the label of the next button
                            // wizardNextBtn.setLabel('Finish');
                            
                            // Display the page
                            loader.hide();
                            wizardNextBtn.hideLoader();
                            wizardNextBtn.enable();
                            
                            // Focus on the relevant component
                            emailAddressTxt.focus();
                        }
                        else {
                            return;
                        }
                    }
                });
            }
            else {
                // Disable buttons and show loader
                wizardNextBtn.showLoader();
                wizardNextBtn.disable();
                loader.show( false );
                
                // Update the page number and heading
                pageNum++;
                wizardHeadingEl.innerHTML = 'Employee Details (Continued) (' + pageNum + '/' + numPages+ ')';
                
                // Display the next page
                wizardPage1ContainerEl.style.display = 'none';
                wizardPage2ContainerEl.style.display = 'flex';
                
                // Enable the previous button
                wizardPreviousBtn.enable();
                
                // Change the label of the next button
                // wizardNextBtn.setLabel('Finish');
                
                // Display the page
                loader.hide();
                wizardNextBtn.hideLoader();
                wizardNextBtn.enable();
                
                // Focus on the relevant component
                emailAddressTxt.focus();
            }
        }
        else if( pageNum === 2 ) {
            // Do sanity checks
            // ...
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Update the page number and heading
            pageNum++;
            wizardHeadingEl.innerHTML = 'Payslip Items (' + pageNum + '/' + numPages+ ')';
            
            // Display the next page
            wizardPage2ContainerEl.style.display = 'none';
            wizardPage3ContainerEl.style.display = 'flex';
            
            // Enable the previous button
            wizardPreviousBtn.enable();
            
            // Display the page
            loader.hide();
            wizardNextBtn.hideLoader();
            wizardNextBtn.enable();
            
            // Focus on the relevant component
            addPayslipItemSelect.focus();
        }
        else if( pageNum === 3 ) {
            // Do sanity checks
            for (let i = 0; i < payslipItems.length; i++) {
                if(payslipItems[i].itemTypeCode !== null) {
                    let amount = lx.util.parseCurrency( payslipItems[i].itemAmountTxt.getValue() );
                    
                    // Add the decimal part, if not available
                    if( !isNaN(amount) ) {
                        // Convert the amount to a string
                        amount = amount + '';
                        
                        // Was the decimal not found?
                        if( !amount.includes('.') ) {
                            amount = amount + '.00';
                        }
                    }
                    
                    if( payslipItems[i].itemAutoCheckbox.getValue() === true ) {
                        amount = null;
                    }
                    else {
                        if( payslipItems[i].itemAmountTxt.getValue().trim() === '' ) {
                            amount = null;
                        }
                        else {
                            if( !(/^\d+\.?\d+$/.test( amount )) ) { 
                                wizardNextBtn.showWarning('The payslip item \'' + payslipItems[i].itemTypeName + '\' doesn\'t have a valid amount');
                                return;
                            }
                        }
                    }
                    
                    if( payslipItems[i].descriptionTxt.getValue() === '' ) {
                        wizardNextBtn.showWarning('The payslip item \'' + payslipItems[i].itemTypeName + '\' has an empty description');
                        return;
                    }
                }
            }
            
            // Was no payslip items added?
            // ...
            
            // Give warning if no income item was added
            // ...
            
            // Give warning if no PAYE, UIF, or SDL items were added
            // ...
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Update the page number and heading
            pageNum++;
            wizardHeadingEl.innerHTML = 'Retirement Funds (' + pageNum + '/' + numPages+ ')';
            
            // Display the next page
            wizardPage3ContainerEl.style.display = 'none';
            wizardPage4ContainerEl.style.display = 'flex';
            
            // Enable the previous button
            wizardPreviousBtn.enable();
            
            // Focus on the relevant component
            if( providentFunds.length > 0 ) {
                providentFunds[0].subscribeCb.setFocus();
            }
            
            // Display the page
            loader.hide();
            wizardNextBtn.hideLoader();
            wizardNextBtn.enable();
        }
        else if( pageNum === 4 ) {
            // Do sanity checks
            for( let i = 0; i < providentFunds.length; i++ ) {
                if( providentFunds[i].subscribeCb.getValue() ) {
                    for( let x = 0; x < providentFunds[i].rfiItems.length; x++ ) {
                        if( providentFunds[i].rfiItems[x].selectedCb.getValue() ) {
                            if( providentFunds[i].rfiItems[x].percentageTxt.validate() !== true ) {
                                wizardNextBtn.showWarning(providentFunds[i].rfiItems[x].percentageTxt.validate());
                                return;
                            }
                        }
                    }
                }
            }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Update the page number and heading
            pageNum++;
            wizardHeadingEl.innerHTML = 'Leave (' + pageNum + '/' + numPages+ ')';
            
            // Display the next page
            wizardPage4ContainerEl.style.display = 'none';
            wizardPage5ContainerEl.style.display = 'flex';
            
            // Enable the previous button
            wizardPreviousBtn.enable();
            
            // Focus on the relevant component
            if( leaveTypes.length > 0 ) {
                leaveTypes[0].subscribeCheckboxEl.setFocus();
            }
            
            // Display the page
            loader.hide();
            wizardNextBtn.hideLoader();
            wizardNextBtn.enable();
        }
        else if( pageNum === 5 ) {
            // Get the leave items
            let leave = [];
            let hasHourlyLeave = false;
            for( let i = 0; i < leaveTypes.length; i++ ) {
                if( !leaveTypes[i].subscribeCheckboxEl.getValue() ) {
                    continue;
                }
                
                if( leaveTypes[i].accruesHourly ) {
                    hasHourlyLeave = true;
                }
                
                leave.push({
                    leaveTypeId: leaveTypes[i].leaveTypeId,
                    leaveItems: []
                });
            }
            
            // Was no leave types selected?
            if( leave.length <= 0 ) {
                // Give warning to user
                new lx.component.Messagebox({
                    title: '<i class="fas fa-exclamation-triangle" style="margin: 0px 15px 0px 0px;"></i>No leave types selected',
                    message: 
                        '<div style="text-align: left;">' + 
                            'The employee has not been subscribed to any leave types. Consequently, leave will not be calculated ' + 
                            'automatically and all leave will have to be added manually.<br><br>' + 
                            'Are you certain you wish to continue?' +
                        '</div>'
                        ,
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'continue', label: 'Continue', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'continue' ) {
                            // Disable buttons and show loader
                            wizardNextBtn.showLoader();
                            wizardNextBtn.disable();
                            loader.show( false );
                            
                            // Update the page number and heading
                            pageNum++;
                            wizardHeadingEl.innerHTML = 'Work Schedule (' + pageNum + '/' + numPages+ ')';
                            
                            // Display the next page
                            wizardPage5ContainerEl.style.display = 'none';
                            wizardPage6ContainerEl.style.display = 'flex';
                            
                            // Enable the previous button
                            wizardPreviousBtn.enable();
                            
                            // Focus on the relevant component
                            workScheduleCb.setFocus();
                            
                            // Change the label of the next button
                            wizardNextBtn.setLabel('Finish');
                            
                            // Display the page
                            loader.hide();
                            wizardNextBtn.hideLoader();
                            wizardNextBtn.enable();
                        }
                        else {
                            return;
                        }
                    }
                });
            }
            else {
                // Determine if the employee has hourly income
                let hasHourlyIncome = false;
                for( let i = 0; i < payslipItems.length; i++ ) {
                    if( (payslipItems[i].itemTypeCode !== null) && (payslipItems[i].unitTypeCode === 'PHOU' ) ) {
                        hasHourlyIncome = true;
                        break;
                    }
                }
                
                // Does the employee have hourly leave but no hourly income?
                if( hasHourlyLeave && !hasHourlyIncome ) {
                    // Give warning to user
                    new lx.component.Messagebox({
                        title: '<i class="fas fa-exclamation-triangle" style="margin: 0px 15px 0px 0px;"></i>Incompatible leave type selected',
                        message: 
                            '<div style="text-align: left;">' + 
                                'The employee has been subscrbed to a leave type that accrues hourly but does not earn an hourly ' + 
                                'wage. Consequently, leave cannot be calculated automatically and all leave will have to be added manually.<br><br>' + 
                                'Are you certain you wish to continue?' +
                            '</div>'
                            ,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                            {name: 'continue', label: 'Continue', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'continue' ) {
                                // Disable buttons and show loader
                                wizardNextBtn.showLoader();
                                wizardNextBtn.disable();
                                loader.show( false );
                                
                                // Update the page number and heading
                                pageNum++;
                                wizardHeadingEl.innerHTML = 'Work Schedule (' + pageNum + '/' + numPages+ ')';
                                
                                // Display the next page
                                wizardPage5ContainerEl.style.display = 'none';
                                wizardPage6ContainerEl.style.display = 'flex';
                                
                                // Enable the previous button
                                wizardPreviousBtn.enable();
                                
                                // Focus on the relevant component
                                workScheduleCb.setFocus();
                                
                                // Change the label of the next button
                                wizardNextBtn.setLabel('Finish');
                                
                                // Display the page
                                loader.hide();
                                wizardNextBtn.hideLoader();
                                wizardNextBtn.enable();
                            }
                            else {
                                return;
                            }
                        }
                    });
                }
                else {
                    // Disable buttons and show loader
                    wizardNextBtn.showLoader();
                    wizardNextBtn.disable();
                    loader.show( false );
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Work Schedule (' + pageNum + '/' + numPages+ ')';
                    
                    // Display the next page
                    wizardPage5ContainerEl.style.display = 'none';
                    wizardPage6ContainerEl.style.display = 'flex';
                    
                    // Enable the previous button
                    wizardPreviousBtn.enable();
                    
                    // Focus on the relevant component
                    workScheduleCb.setFocus();
                    
                    // Change the label of the next button
                    wizardNextBtn.setLabel('Finish');
                    
                    // Display the page
                    loader.hide();
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                }
            }
        }
        else if( pageNum === 6 ) {
            // Determine if the employee has daily income
            let hasDailyIncome = false;
            for( let i = 0; i < payslipItems.length; i++ ) {
                if( (payslipItems[i].itemTypeCode !== null) && (payslipItems[i].unitTypeCode === 'PDAY' ) ) {
                    hasDailyIncome = true;
                    break;
                }
            }
            
            // Was the work schedule selected?
            if( workScheduleCb.getValue() ) {
                // Was no day selected?
                if( !mondayCb.getValue() && !tuesdayCb.getValue() && !wednesdayCb.getValue() && !thursdayCb.getValue() && 
                    !fridayCb.getValue() && !saturdayCb.getValue() && !sundayCb.getValue() ) {
                    wizardNextBtn.showWarning('Please select one or more work schedule days.');
                    return;
                }
                
                // Check that correct valid values were entered for work schedule days
                if( mondayCb.getValue() ) {
                    if( mondayHoursTxt.getValue() === '' ) {
                        wizardNextBtn.showWarning('Please enter the number of hours for Monday.');
                        return;
                    }
                    else if( !isNaN(parseInt(mondayHoursTxt.getValue())) ) {
                        if( parseInt(mondayHoursTxt.getValue()) <= 0 || parseInt(mondayHoursTxt.getValue()) >= 25 ) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Monday.');
                            return;
                        }
                    }
                }
                
                if( tuesdayCb.getValue() ) {
                    if( tuesdayHoursTxt.getValue() === '' ) {
                        wizardNextBtn.showWarning('Please enter the number of hours for Tuesday.');
                        return;
                    }
                    if( !isNaN(parseInt(tuesdayHoursTxt.getValue())) ) {
                        if (parseInt(tuesdayHoursTxt.getValue()) <= 0 || parseInt(tuesdayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Tuesday.');
                            return;
                        }
                    }
                }
                
                if( wednesdayCb.getValue() ) {
                    if (wednesdayHoursTxt.getValue() === '') {
                        wizardNextBtn.showWarning('Please enter the number of hours for Wednesday.');
                        return;
                    }
                    if (!isNaN(parseInt(wednesdayHoursTxt.getValue()))) {
                        if (parseInt(wednesdayHoursTxt.getValue()) <= 0 || parseInt(wednesdayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Wednesday.');
                            return;
                        }
                    }
                }
                
                if( thursdayCb.getValue() ) {
                    if (thursdayHoursTxt.getValue() === '') {
                        wizardNextBtn.showWarning('Please enter the number of hours for Thursday.');
                        return;
                    }
                    if (!isNaN(parseInt(thursdayHoursTxt.getValue()))) {
                        if (parseInt(thursdayHoursTxt.getValue()) <= 0 || parseInt(thursdayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Thursday.');
                            return;
                        }
                    }
                }
                
                if( fridayCb.getValue() ) {
                    if (fridayHoursTxt.getValue() === '') {
                        wizardNextBtn.showWarning('Please enter the number of hours for Friday.');
                        return;
                    }
                    if (!isNaN(parseInt(fridayHoursTxt.getValue()))) {
                        if (parseInt(fridayHoursTxt.getValue()) <= 0 || parseInt(fridayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Friday.');
                            return;
                        }
                    }
                }
                
                if( saturdayCb.getValue() ) {
                    if (saturdayHoursTxt.getValue() === '') {
                        wizardNextBtn.showWarning('Please enter the number of hours for Saturday.');
                        return;
                    }
                    if (!isNaN(parseInt(saturdayHoursTxt.getValue()))) {
                        if (parseInt(saturdayHoursTxt.getValue()) <= 0 || parseInt(saturdayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Saturday.');
                            return;
                        }
                    }
                }
                
                if( sundayCb.getValue() ) {
                    if (sundayHoursTxt.getValue() === '') {
                        wizardNextBtn.showWarning('Please enter the number of hours for Sunday.');
                        return;
                    }
                    if (!isNaN(parseInt(sundayHoursTxt.getValue()))) {
                        if (parseInt(sundayHoursTxt.getValue()) <= 0 || parseInt(sundayHoursTxt.getValue()) >= 25) {
                            wizardNextBtn.showWarning('Please enter a number between 1 and 24 for Sunday.');
                            return;
                        }
                    }
                }
                
                // Does the employee have daily income?
                if( hasDailyIncome ) {
                    // Give a warning to the user
                    new lx.component.Messagebox({
                        title: '<i class="fas fa-exclamation-triangle" style="margin: 0px 15px 0px 0px;"></i>Work schedule not required',
                        message: 
                            '<div style="text-align: left;">' + 
                                'You have selected to use the work schedule to calculate the employee&apos;s leave. However, ' + 
                                'since the employee earns a daily wage it is recommended not to enable the work schedule but ' +
                                'that the number of days worked as specified on the payslip be used instead.' +
                                '<br><br>Are you certain you wish to continue?' +
                            '</div>'
                            ,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                            {name: 'continue', label: 'Continue', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'continue' ) {
                                // Add the employee
                                addEmployee();
                            }
                            else {
                                return;
                            }
                        }
                    });
                    
                }
                else {
                    // Add the employee
                    addEmployee();
                }
            }
            else {
                // Get the leave items
                let checkLeaveTypes = [];
                for( let i = 0; i < leaveTypes.length; i++ ) {
                    if( !leaveTypes[i].subscribeCheckboxEl.getValue() ) {
                        continue;
                    }
                    
                    checkLeaveTypes.push({
                        id: leaveTypes[i].leaveTypeId
                    });
                }
                
                // Disable buttons and show loader
                wizardNextBtn.showLoader();
                wizardNextBtn.disable();
                
                // Give warning if work schedule is required, but was not selected
                lx.sendJSON({
                    url: 'exec.php?c=Leave&fn=checkWorkSchedule',
                    data: {
                        leaveTypes: checkLeaveTypes
                    },
                    onSuccess: function( jsonResult ) {
                        var response = JSON.parse(jsonResult);
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                    
                        // Was the request not successful?
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Failed To Check Leave Types',
                                message: response.error
                            });
                            return;
                        }
                        
                        // Make a list of leave types that require the work schedule
                        let leaveTypeNames = '';
                        if( response.leaveTypes.length > 0 ) {
                            for( let i = 0; i < response.leaveTypes.length; i++ ) {
                                leaveTypeNames = leaveTypeNames + response.leaveTypes[i].name + '<br>';
                            }
                        }
                        
                        // Does the employee NOT have daily income and are there leave types that require the work schedule?
                        if( !hasDailyIncome && (leaveTypeNames !== '') ) {
                            // Give a warning to the user
                            new lx.component.Messagebox({
                                title: '<i class="fas fa-exclamation-triangle" style="margin: 0px 15px 0px 0px;"></i>Work schedule required',
                                message: 
                                    '<div style="text-align: left;">' + 
                                        'The following leave types may require the work schedule:<br><br>' + 
                                        leaveTypeNames + 
                                        '<br>Are you certain you wish to continue?' +
                                    '</div>'
                                    ,
                                buttons: [
                                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                                    {name: 'continue', label: 'Continue', isDefault: true}
                                ],
                                onClose: function( event ) {
                                    if( event.button === 'continue' ) {
                                        // Add the employee
                                        addEmployee();
                                    }
                                    else {
                                        return;
                                    }
                                }
                            });
                        }
                        else {
                            // Add the employee
                            addEmployee();
                        }
                    }
                });
            }
        }
    }
    
    // The default on change event handler
    function defaultOnChangeEventHandler() {
        // Remember that changes were made
        formChanged = true;
    }
    
    // codeTxt on change event handler
    function codeTxtChangeEventHandler() {
        // Was a code specified?
        if( codeTxt.getValue() !== '' ) {
            // Format the code
            codeTxt.setValue( lx.util.maskFormat(codeMask, codeTxt.getValue()) );
        }
        
        // Remember that changes were made
        formChanged = true;
    }
    
    // idNumberTxt on change event handler
    function idNumberTxtChangeEventHandler() {
        // Do nothing if date of birth already has a value
        if( (dateOfBirthDate.getValue() !== '') && (dateOfBirthDate.getValue() !== null) ) {
            return;
        }
        
        // Get the id number and check that it is valid
        var idNumber = idNumberTxt.getValue();
        idNumber = idNumber.replace(/\s/g,'');
        if (idNumber.length != 13 || isNaN(idNumber)) {
            return;
        }
        
        // Get first 6 digits as a valid birth date
        var birthDate = new Date(idNumber.substring(0, 2), idNumber.substring(2, 4) - 1, idNumber.substring(4, 6));
        
        // Was an invalid month found?
        if( (parseInt(idNumber.substring(2, 4)) >= 13) || 
            (parseInt(idNumber.substring(2, 4)) < 1) ) {
            return;
        }
        
        // Was an invalid day found?
        if( (parseInt(idNumber.substring(4, 6)) >= 32) || 
            (parseInt(idNumber.substring(4, 6)) < 1) ) {
            return;
        }
        
        // Get the day, month and year components of the birth date
        var idDay = birthDate.getDate();
        var idMonth = birthDate.getMonth();
        var idYear = birthDate.getFullYear();
        
        // Prepend zeroes to day value if needed
        if (idDay < 10) {
            idDay = '0' + idDay;
        }
        
        // Adjust the month value and prepend zeroes if needed
        idMonth = idMonth + 1;
        if (idMonth < 10) {
            idMonth = '0' + idMonth;
        }
        
        // If the year is before 1930, assume it's in the next century
        if (idYear < 1930) {
            idYear = idYear.toString();
            idYear = idYear.replace('19', '20');
        }
        
        // Set the date of birth
        // var dateOfBirth = idYear + '-' + idMonth + '-' + idDay
        dateOfBirthDate.setValue( idYear + '-' + idMonth + '-' + idDay );
        
        // Remember that changes were made
        formChanged = true;
    }
    
    // paymentPeriodSelect change event handler
    function paymentPeriodSelectChangeEventHandler() {
        var days = [];
        
        // Set the payment day values depending on the payment period
        if( paymentPeriodSelect.getValue() === 'WEEK' ) {
            days.push(
                {value: 1, text: 'Monday'},
                {value: 2, text: 'Tuesday'},
                {value: 3, text: 'Wednesday'},
                {value: 4, text: 'Thursday'},
                {value: 5, text: 'Friday'},
                {value: 6, text: 'Saturday'},
                {value: 0, text: 'Sunday'}
            );
        }
        else if( paymentPeriodSelect.getValue() === 'BWEE' ) {
            days.push(
                {value: 1, text: 'Monday'},
                {value: 2, text: 'Tuesday'},
                {value: 3, text: 'Wednesday'},
                {value: 4, text: 'Thursday'},
                {value: 5, text: 'Friday'},
                {value: 6, text: 'Saturday'},
                {value: 0, text: 'Sunday'}
                // {value:  1, text: 'Week 1: Monday'},
                // {value:  2, text: 'Week 1: Tuesday'},
                // {value:  3, text: 'Week 1: Wednesday'},
                // {value:  4, text: 'Week 1: Thursday'},
                // {value:  5, text: 'Week 1: Friday'},
                // {value:  6, text: 'Week 1: Saturday'},
                // {value:  0, text: 'Week 1: Sunday'},
                // {value:  8, text: 'Week 2: Monday'},
                // {value:  9, text: 'Week 2: Tuesday'},
                // {value: 10, text: 'Week 2: Wednesday'},
                // {value: 11, text: 'Week 2: Thursday'},
                // {value: 12, text: 'Week 2: Friday'},
                // {value: 13, text: 'Week 2: Saturday'},
                // {value:  7, text: 'Week 2: Sunday'}
            );
        }
        else if( paymentPeriodSelect.getValue() === 'MONT' ) {
            for( var i = 1; i < 29; i++ ) {
                days.push({value: i, text: i});
            }
            days.push({value: 0, text: 'Last Day'});
        }
        else {
            return;
        }
        
        // Set and display the payment period end days
        paymentPeriodEndDaySelect.setValue(null, '');
        paymentPeriodEndDaySelect.clear();
        paymentPeriodEndDaySelect.addItems( days );
        // paymentPeriodEndDaySelect.show();
        
        // Set and display the payment days
        paymentDaySelect.setValue(null, '');
        paymentDaySelect.clear();
        paymentDaySelect.addItems( days );
        
        // Remember that changes were made
        formChanged = true;
    }
    
    // addDepartmentBtn click event handler
    function addDepartmentBtnClickEventHandler() {
        // Create a modal window
        var addDepartmentModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '232px'
        });
        
        // Create the addDepartmentPanel panel
        var addDepartmentPanel = new app.panel.AddDepartment({
            renderTo: addDepartmentModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function( result ) {
                app.route.popState();
                loadDepartments(result.departmentId, result.departmentName);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addDepartmentModal.addEventListener('destroy', function() {
            addDepartmentPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addDepartmentModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addDepartmentModal.show();
        addDepartmentPanel.focus();
    }
    
    // postalAddressCb on change event handler
    function postalAddressCbChangeEventHandler() {
        if( postalAddressCb.getValue() === true ) {
            lx.applyStyle( postalAddressContainerEl, {display: 'none'} );
        }
        else {
            lx.applyStyle( postalAddressContainerEl, {display: 'block'} );
        }
        
        formChanged = true;
    }
    
    // useCompanyWorkAddressCb on change event handler
    function useCompanyWorkAddressCbChangeEventHandler() {
        if( useCompanyWorkAddressCb.getValue() === true ) {
            lx.applyStyle( workAddressContainerEl, {display: 'none'} );
        }
        else {
            lx.applyStyle( workAddressContainerEl, {display: 'block'} );
        }
        
        formChanged = true;
    }
    
    // recurringItemRemoveBtn click event handler
    function recurringItemRemoveBtnElClickEventHandler(event) {
        let currentElement = event.currentTarget.parentElement.parentElement;
        
        // Find the rule that was clicked
        let itemIndex = null;
        for( let i = 0; i < payslipItems.length; i++ ) {
            if( payslipItems[i].el === currentElement ) {
                itemIndex = i;
                break;
            }
        }
        
        // If no itemIndex is set then we did not find the rule.
        if( itemIndex === null ) return;
        
        // Remove the rule element
        paylsipItemContainerEl.removeChild( payslipItems[itemIndex].el );
        payslipItems.splice(itemIndex, 1);
        formChanged = true;
        updateRfiItems();
    }
    
    // addPayslipItemSelect search event handler
    function addPayslipItemSelectSearchEventHandler() {
        addPayslipItemSelect.clear();
        loadPayslipItemTypes(addPayslipItemSelect);
    }
    
    // addPayslipItemSelect change event handler
    function addPayslipItemSelectChangeEventHandler() {
        createPayslipItemCard( addPayslipItemSelect.getValue() );
        addPayslipItemSelect.setValue(null, '');
        formChanged = true;
        updateRfiItems();
    }
    
    // subscribeCb change event handler
    function subscribeProvidentFundCbChangeEventHandler( event ) {
        formChanged = true;
        
        // Get the index of the selected item
        let providentFundIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            if( providentFunds[i].id === event.id ) {
                providentFundIndex = i;
                break;
            }
        }
        if( providentFundIndex === null ) return;
        
        // Was the provident fund selected?
        if( !providentFunds[providentFundIndex].subscribeCb.getValue() ) {
            // Add the rfi items, if any
            let rfiItems = [];
            for( let i = 0; i < providentFunds[providentFundIndex].rfiItems.length; i++ ) {
                // Was the rfi item selected?
                if( providentFunds[providentFundIndex].rfiItems[i].selectedCb.getValue() ) {
                    // Check if the percentage is valid
                    let percentage = lx.util.parseCurrency( providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue() );
                    if( isNaN(providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue()) ) {
                        new lx.component.Messagebox({
                            title: 'Retriment Fund Subscription Failed',
                            message: 'The specified income item percentage is not a valid number.'
                        });
                        
                        focusRfiItem( providentFundIndex, i );
                        return;
                    }
                    
                    // Add the rfi item
                    rfiItems.push({
                        percentage: percentage
                    });
                }
            }
            
            // Get earning items
            let earningItems = [];
            for (let i = 0; i < payslipItems.length; i++) {
                if(payslipItems[i].itemTypeCode !== null) {
                    
                    let amount = payslipItems[i].itemAmountTxt.getValue();
                    if(payslipItems[i].itemAutoCheckbox.getValue() === true) {
                        amount = null;
                    }
                    else {
                        if(amount === '') {
                            amount = null;
                        }
                    }
                    
                    let unitSource = null;
                    if( payslipItems[i].importHoursCheckbox.getValue() ) unitSource = 'ATTE';
                    
                    earningItems.push({
                        code: payslipItems[i].itemTypeCode,
                        description: payslipItems[i].descriptionTxt.getValue(),
                        autoCalculate: payslipItems[i].itemAutoCheckbox.getValue(),
                        unitSourceCode: unitSource,
                        includeInNettPay: payslipItems[i].partOfNettPayCheckbox.getValue(), 
                        amount: amount,
                        isOnceOff: false,
                        categoryCode: payslipItems[i].categoryCode,
                        uniqueId: payslipItems[i].uniqueId
                    });
                }
            }
            
            // Subscribe the specified provident fund
            let parentContainer = providentFunds[providentFundIndex].fundContainerEl;
            while (parentContainer.childNodes.length > 1) {
                parentContainer.removeChild(parentContainer.lastChild);
            }
            
            // Is the provident fund contribution calculated from rfi items?
            if( providentFunds[providentFundIndex].typeCode === 'PRFI' ) {
                // Display a message of how the provident fun contribution is calculated
                lx.createElement('DIV', {
                    parent: providentFunds[providentFundIndex].fundContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '15px 15px 0px 15px'
                        
                    },
                    innerHTML: 
                        'The retirement fund contribution will be calculated as a percentage of the employee\'s earnings. ' + 
                        'The employee will contribute ' + 
                        lx.util.formatCurrency( providentFunds[providentFundIndex].employeeAmount ) + 
                        '% and the employer will contribute ' + 
                        lx.util.formatCurrency( providentFunds[providentFundIndex].employerAmount ) + 
                        '% of the following selected income items:'
                });
                
                // Display the retirment fund income items
                let rfiItemsEl = lx.createElement('DIV', {
                    parent: providentFunds[providentFundIndex].fundContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '15px 15px'
                        
                    }
                });
                providentFunds[providentFundIndex].rfiItemsEl = rfiItemsEl;
                
                // Create retirment fund heading element
                lx.createElement('DIV', {
                    parent: rfiItemsEl,
                    style: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        width: '480px',
                        // height: '35px',
                        margin: '0px 0px 5px 0px',
                        // borderStyle: 'solid',
                        // borderWidth: '0px 0px 1px 0px',
                        // borderColor: '#DFDFDF'
                    },
                    innerHTML:
                        '<div style="width: 40px; margin: 0px 0px 0px 0px">Select</div>' +
                        '<div style="width: 320px; margin: 0px 0px 0px 10px">Income</div>' +
                        '<div style="text-align: left; width: 100px; margin: 0px 0px 0px 10px">Percentage</div>'
                });
                
                // Add the new rfi item
                let rfiItems = null;
                for (var i = 0; i < earningItems.length; i++) {
                    if(earningItems[i].categoryCode === 'INCO') {
                        rfiItems = {
                            description: earningItems[i].description,
                            percentage: '100.000000',
                            payslipItemTypesCode: earningItems[i].code,
                            uniqueId: earningItems[i].uniqueId
                        };
                        addRfiItem(providentFundIndex, rfiItems, null, rfiItemsEl);
                    }
                }
            }
            else {
                // Display a message of how the provident fun contribution is calculated
                lx.createElement('DIV', {
                    parent: providentFunds[providentFundIndex].fundContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '15px 15px'
                        
                    },
                    innerHTML: 
                        'The retirement fund contribution is fixed at ' + 
                        lx.util.formatCurrency( providentFunds[providentFundIndex].employeeAmount ) + 
                        ' for the employee and ' + 
                        lx.util.formatCurrency( providentFunds[providentFundIndex].employerAmount ) + 
                        ' for the employer.'
                });
            }
        }
        else {
            // Unsubscribe the specified provident fund
            let parentContainer = providentFunds[providentFundIndex].fundContainerEl;
            while (parentContainer.childNodes.length > 1) {
                parentContainer.removeChild(parentContainer.lastChild);
            }
            
            lx.createElement('DIV', {
                parent: providentFunds[providentFundIndex].fundContainerEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '15px 15px'
                    
                },
                innerHTML: 'The employee is not a member of this retirement fund.'
            });
        }
    }
    
    // Retirement fund income item selecletedCb change event handler
    function rfiItemSelectedCbOnChangeEventHandler( event ) {
        // Get the index of the selected item
        let providentFundIndex = 0;
        let rfiItemIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            for( let j = 0; j < providentFunds[i].rfiItems.length; j++ ) {
                if( providentFunds[i].rfiItems[j].selectedCb === event.srcComponent ) {
                    providentFundIndex = i;
                    rfiItemIndex = j;
                    break;
                }
            }
        }
        if( rfiItemIndex === null ) return;
        
        // Was the rfi item selected?
        if( providentFunds[providentFundIndex].rfiItems[rfiItemIndex].selectedCb.getValue() === true ) {
            providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.enable();
            focusRfiItem(providentFundIndex, rfiItemIndex);
        }
        else {
            providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.disable();
        }
    }
    
    // Retirement fund income item percentageTxt change event handler
    function rfiItemPercentageTxtOnChangeEventHandler( event ) {
        // Get the index of the selected item
        let providentFundIndex = 0;
        let rfiItemIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            for( let j = 0; j < providentFunds[i].rfiItems.length; j++ ) {
                if( providentFunds[i].rfiItems[j].percentageTxt === event.srcComponent ) {
                    providentFundIndex = i;
                    rfiItemIndex = j;
                    break;
                }
            }
        }
        if( rfiItemIndex === null ) return;
    }
    
    // subscribeCheckbox on change event handler
    function subscribeCheckboxChangeEventHandler(leaveTypeId, messageEl, subscribeEl) {
        // Find the leave type to subscribe to.
        let leaveType = null;
        for (var i = 0; i < leaveTypes.length; i++) {
            if(leaveTypes[i].leaveTypeId === leaveTypeId){
                leaveType = leaveTypes[i];
                break;
            }
        }
        
        // Check that the leave type was found.
        if( leaveType === null ) {
            let action = '';
            if( leaveTypes[i].subscribeCheckboxEl.getValue() === true ) action = 'disable';
            else action = 'enable';
            
            new lx.component.Messagebox({
                message: 'Failed to ' + action + ' leave type for employee.'
            });
            
            return;
        }
        
        if (!subscribeEl.getValue()) {
            messageEl.innerHTML = 'The employee is now subscribed to this leave type.';
        }
        else {
            messageEl.innerHTML = 'The employee does not have any leave of this type.';
        }
        
        formChanged = true;
        return;
    }
    
    // workScheduleCb on change event handler
    function workScheduleCbChangeEventHandler() {
        if( workScheduleCb.getValue() === false ) {
            lx.applyStyle( workScheduleContainerEl, {display: 'none'} );
        }
        else {
            lx.applyStyle( workScheduleContainerEl, {display: 'block'} );
        }
        
        formChanged = true;
    }
    
    // mondayCb on change event handler
    function mondayCbOnChangeEventHandler() {
        if (mondayCb.getValue()) {
            mondayHoursTxt.enable();
        }
        else {
            mondayHoursTxt.disable();
            mondayHoursTxt.setValue('');
        }
    }
    
    // tuesdayCb on change event handler
    function tuesdayCbOnChangeEventHandler() {
        if (tuesdayCb.getValue()) {
            tuesdayHoursTxt.enable();
        }
        else {
            tuesdayHoursTxt.disable();
            tuesdayHoursTxt.setValue('');
        }
    }
    
    // wednesdayCb on change event handler
    function wednesdayCbOnChangeEventHandler() {
        if (wednesdayCb.getValue()) {
            wednesdayHoursTxt.enable();
        }
        else {
            wednesdayHoursTxt.disable();
            wednesdayHoursTxt.setValue('');
        }
    }
    
    // thursdayCb on change event handler
    function thursdayCbOnChangeEventHandler() {
        if (thursdayCb.getValue()) {
            thursdayHoursTxt.enable();
        }
        else {
            thursdayHoursTxt.disable();
            thursdayHoursTxt.setValue('');
        }
    }
    
    // fridayCb on change event handler
    function fridayCbOnChangeEventHandler() {
        if (fridayCb.getValue()) {
            fridayHoursTxt.enable();
        }
        else {
            fridayHoursTxt.disable();
            fridayHoursTxt.setValue('');
        }
    }
    
    // saturdayCb on change event handler
    function saturdayCbOnChangeEventHandler() {
        if (saturdayCb.getValue()) {
            saturdayHoursTxt.enable();
        }
        else {
            saturdayHoursTxt.disable();
            saturdayHoursTxt.setValue('');
        }
    }
    
    // sundayCb on change event handler
    function sundayCbOnChangeEventHandler() {
        if (sundayCb.getValue()) {
            sundayHoursTxt.enable();
        }
        else {
            sundayHoursTxt.disable();
            sundayHoursTxt.setValue('');
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};