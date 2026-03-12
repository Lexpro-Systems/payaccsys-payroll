/* globals app, lx */
'use strict';


// SETUP WIZARD PANEL
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
app.panel.SetupWizard = function(config) {
    
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
    
    var wizardPage2ContainerEl = null;
    var companySectionEl = null;
    var companyNameTxt = null;
    var companyAliasTxt = null;
    var companyRegistrationTxt = null;
    var physicalAddressSectionEl = null;
    var physicalAddressCountrySelect = null;
    var physicalAddressCityTxt = null;
    var physicalAddressSuburbTxt = null;
    var physicalAddressStreetTxt = null;
    var physicalAddressComplexTxt = null;
    var physicalAddressUnitTxt = null;
    var physicalAddressPostalCodeTxt = null;
    var postalAddressSectionEl = null;
    var postalAddressLine1Txt = null;
    var postalAddressLine2Txt = null;
    var postalAddressLine3Txt = null;
    var postalAddressCodeTxt = null;
    var contactDetailsSectionEl = null;
    var emailAddressTxt = null;
    var telNumbertxt = null;
    var faxNumberTxt = null;
    var taxSectionEl = null;
    var payeReferenceTxt = null;
    var sdlPaymentReferenceTxt = null;
    var uifPaymentReferenceTxt = null;
    var uifRegistrationNumberTxt = null;
    var standardIndustryClassificationSelect = null;
    var employmentTaxIncentiveSelect = null;
    var specialEconomicZoneSelect = null;
    var diplomaticIndemnityCheckbox = null;
    var sarsContactSectionEl = null;
    var sarsContactFirstNameTxt = null;
    var sarsContactLastNameTxt = null;
    var sarsContactEmailTxt = null;
    var sarsContactBusinessNumberTxt = null;
    var sarsContactCellNumberTxt = null;
    var uifContactSectionEl = null;
    var uifContactNameTxt = null;
    var uifContactEmailTxt = null;
    var uifContactNumberTxt = null;
    var bankAccountsGrid = null;
    
    var wizardPage3ContainerEl = null;
    var addLeaveTypeBtn = null;
    var leaveTypeContainerEl = null;
    
    var wizardPage4ContainerEl = null;
    var addProvidentFundBtn = null;
    var providentFundContainerEl = null;
    
    var wizardPage5ContainerEl = null;
    var payslipDetailsContainerEl = null;
    var previewPayslipBtn = null;
    var editPayslipBtn = null;
    var payslipImageDirExists = false;
    var payslipTemplateId = null;
    var payslipConfigItems = [];
    
    var wizardPage6ContainerEl = null;
    var lexproAccountingDetailsContainerEl = null;
    
    var wizardPage7ContainerEl = null;
    var miscellaneousDetailsContainerEl = null;
    var sendBirthdayNotificationsCb = null;
    var emailPayslipsCb = null;
    var leaveRequestEditBtn = null;
    var leaveRequestAdminEmailTxt = null;
    
    var pageNum = 1;
    var numPages = 7;
    var sectionBackgroundColor = '#F5F6F7';
    
    var allocationTypes = [
        { value: 'ADJU', text: 'Adjustment' },
        { value: 'LEAR', text: 'Leave Earned' },
        { value: 'LTAK', text: 'Leave Taken' },
        { value: 'RESE', text: 'Reset' }
    ];
    
    var leaveTypes = [];
    
    
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
    
    // Function to update company details
    function updateCompany( key, value ) {
        // Set the data to update
        var data = {};
        data[key] = value;
        
        // Update the company data
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: data,
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Company Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // Function to load countries
    function loadCountries( srcComponent ) {
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: {
                searchString: srcComponent.getSearchString(),
                limit: 20,
                offset: srcComponent.getItemCount(),
                sortOrder: 'ASC'
            },
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
                
                srcComponent.addItems( countries );
            }
        });
    }
    
    // Function to load sic codes
    function loadSicCodes( srcComponent ) {
        lx.sendJSON({
            url: 'exec.php?c=Types&fn=getSicCodeList',
            data: {
                searchString: srcComponent.getSearchString(),
                limit: 20,
                offset: srcComponent.getItemCount(),
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
                
                srcComponent.addItems( sicCodes );
            }
        });
    }
    
    // Function to load company bank details
    function loadCompanyBankDetails( srcComponent, clearComponent ) {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getBankList',
            data: {
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Bank Accounts Failed',
                        message: response.error
                    });
                }
                
                var accounts = [];
                for( var i = 0; i < response.accounts.length; i++ ) {
                    accounts.push({
                        id: response.accounts[i].id,
                        bankName: response.accounts[i].financialInstitutionName,
                        bankType: response.accounts[i].bankAccountTypeName,
                        accountNumber: response.accounts[i].accountNumber,
                        branchCode: response.accounts[i].branchCode,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                if( clearComponent ) {
                    srcComponent.clear();
                }
                
                srcComponent.addRows( accounts );
            }
        });
    }
    
    // Function to load leave types
    function loadLeaveTypes() {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            onSuccess: function( jsonResult ) {
                var response = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load leave types',
                        message: response.error
                    });
                    return;
                }
                
                // Were no leave types found?
                if( response.leaveTypes.length <= 0 ) {
                    // Display note to user
                    new lx.createElement('DIV', {
                        parent: leaveTypeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            padding: '10px 15px'
                        },
                        innerHTML: 'No leave types found. Please click on the &apos;Add&apos; button below to add leave types.'
                    });
                    return;
                }
                
                // Add leave type sections
                for( let i = 0; i < response.leaveTypes.length; i++ ) {
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: leaveTypeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            maxWidth: '900px',
                            margin: (i > 0 ? '15px 0px 0px 0px' : '0px 0px 0px 0px'),
                            backgroundColor: lx.style.global.backgroundColor,
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF'
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
                        },
                        innerHTML: '<b>' + response.leaveTypes[i].name + '</b>'
                    });
                    
                    // Create the menu dropdown button
                    let typeDropDownBtn = new lx.component.DropdownButton({
                        renderTo: typeHeadingEl,
                        margin: '0px 0px 0px 5px',
                        label: '<i class="fa fa-ellipsis-v"></i>',
                        dropdownAlignment: 'right'
                    });
                    
                    // Create the menuDropDownBtnAddEl element
                    let typeDropDownBtnEditEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                    });
                    typeDropDownBtnEditEl.addEventListener('click', leaveTypeDropDownBtnEditElClickEventHandler.bind(me, response.leaveTypes[i].id));
                    
                    let typeDropDownBtnDeleteEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                    });
                    typeDropDownBtnDeleteEl.addEventListener('click', leaveTypeDropDownBtnDeleteElClickEventHandler.bind(me, response.leaveTypes[i].id, response.leaveTypes[i].name));
                    
                    // Create an item for each rule
                    for( let j = 0; j < response.leaveTypes[i].rules.length; j++ ) {
                        let rule = response.leaveTypes[i].rules[j];
                        let ruleText = '';
                        
                        // Convert leave to string
                        if( rule.accrualType.code === 'HWOR' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                ' hours worked.';
                        }
                        else if( rule.accrualType.code === 'DWOR' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                ' days worked.';
                        }
                        else if( rule.accrualType.code === 'PAYS' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                ' payslips received.';
                        }
                        else if( rule.accrualType.code === 'DCST' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() +
                                ' of leave at the beginning of every ' + rule.accrualInterval + ' day cycle.';
                        }
                        else if( rule.accrualType.code === 'DCEN' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                rule.accrualInterval + ' day cycle.';
                        }
                        else if( rule.accrualType.code === 'MCST' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' + 
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if( rule.accrualType.code === 'MCEN' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if( rule.accrualType.code === 'YCST' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' + 
                                rule.accrualInterval + ' year cycle.';
                        }
                        else if( rule.accrualType.code === 'YCEN' ) {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                rule.accrualInterval + ' year cycle.';
                        }
                        
                        lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'
                                
                            },
                            innerHTML: ruleText
                        });
                    }
                    
                    let ruleText = '';
                    if (response.leaveTypes[i].rules.length === 0 ) {
                        ruleText = 'This type does not have any rules.';
                        
                        lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'
                                
                            },
                            innerHTML: ruleText
                        });
                    }
                    
                }
            }
        });
    }
    
    // Function to load retirement funds
    function loadRetirementFunds() {
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=getList',
            onSuccess: function( jsonResult ) {
                var response = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load retirement funds',
                        message: response.error
                    });
                    return;
                }
                
                // Clear the existing provident funds
                providentFundContainerEl.innerHTML = '';
                
                // Were no provident funds found?
                if( response.providentFunds.length <= 0 ) {
                    // Display note to user
                    new lx.createElement('DIV', {
                        parent: providentFundContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            padding: '10px 15px'
                        },
                        innerHTML: 'No retirement funds found. Please click on the &apos;Add&apos; button below to add a retirement fund.'
                    });
                    return;
                }
                
                // Add retirement funds sections
                for( let i = 0; i < response.providentFunds.length; i++ ) {
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: providentFundContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            margin: (i > 0 ? '15px 0px 0px 0px' : '0px 0px 0px 0px'),
                            backgroundColor: lx.style.global.backgroundColor,
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF'
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
                        },
                        innerHTML: '<b>' + response.providentFunds[i].providentFundName + '</b>'
                    });
                    
                    // Create the menu dropdown button
                    let typeDropDownBtn = new lx.component.DropdownButton({
                        renderTo: typeHeadingEl,
                        margin: '0px 0px 0px 5px',
                        label: '<i class="fa fa-ellipsis-v"></i>',
                        dropdownAlignment: 'right'
                    });
                    
                    // Create the menuDropDownBtnAddEl element
                    let providentFundTypeEditEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                    });
                    providentFundTypeEditEl.addEventListener('click', providentFundTypeEditElClickEventHandler.bind(me, response.providentFunds[i].id));
                    
                    let providentFundTypeDeleteEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                    });
                    providentFundTypeDeleteEl.addEventListener('click', providentFundTypeDeleteElClickEventHandler.bind(me, response.providentFunds[i].id, response.providentFunds[i].providentFundName));
                    
                    var detailsContainer = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            padding: '10px 15px'
                            
                        }
                    });
                    
                    var fundType = 'Percentage';
                    var sign = '%';
                    if (response.providentFunds[i].providentFundCalculationTypeCode === 'FIXE') {
                        fundType = 'Amount';
                        sign = '';
                    }
                    
                    var employeeAmountDisplay = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Employee ' + fundType + ':',
                        labelWidth: '230px',
                        margin: '0px 0px 0px 0px'
                    });
                    let employeeAmount = response.providentFunds[i].employeeAmount;
                    employeeAmount = (Math.round(employeeAmount * 100) / 100).toFixed(2);
                    employeeAmountDisplay.setValue( employeeAmount + sign);
                    
                    var employerAmountDisplay = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Employer ' + fundType + ':',
                        labelWidth: '230px',
                        margin: '10px 0px 0px 0px'
                    });
                    let employerAmount = response.providentFunds[i].employerAmount;
                    employerAmount = (Math.round(employerAmount * 100) / 100).toFixed(2);
                    employerAmountDisplay.setValue( employerAmount + sign);
                    
                    var enrolledEmployees = new lx.component.Display({
                        renderTo: detailsContainer,
                        label: 'Enrolled Employees:',
                        labelWidth: '230px',
                        margin: '10px 0px 0px 0px'
                    });
                    enrolledEmployees.setValue(response.providentFunds[i].enrolledEmployees);
                }
            }
        });
    }
    
    // Function to load and display the payslip details
    function loadPayslipDetails() {
        // Get the default payslip template
        lx.sendJSON({
            url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Templates Failed',
                        message: response.error
                    });
                    return;
                }
                
                payslipTemplateId = null;
                for( var i = 0; i < response.payslipTemplates.length; i++ ) {
                    if( response.payslipTemplates[i].description === 'Default' ) {
                        payslipTemplateId = response.payslipTemplates[i].id;
                        break;
                    }
                }
                
                if( payslipTemplateId === null ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Templates Failed',
                        message: 'The default payslip template could not be found.'
                    });
                    return;
                }
                
                payslipDetailsContainerEl.innerHTML = '';
                
                lx.sendJSON({
                    url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesConfig',
                    data: {
                        payslipTemplateId: payslipTemplateId
                    },
                    onSuccess: function( responseText ) {
                        
                        var response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Loading Payslip Config Failed',
                                message: response.error
                            });
                            return;
                        }
                        
                        payslipImageDirExists = response.clientDataDirExists;
                        if( !payslipImageDirExists ) {
                            new lx.component.Messagebox({
                                title: 'System Error',
                                message: 'Company directory not found. Please contact support'
                            });
                        }
                        
                        payslipConfigItems = response.templateConfig;
                        for (var i = 0; i < response.templateConfig.length; i++) {
                            createPayslipConfigItems(response.templateConfig[i].description, response.templateConfig[i].value, response.templateConfig[i].type);
                        }
                        
                    }
                });
            }
        });
    }
    
    // Function to create payslip template configuration items
    function createPayslipConfigItems(label, value, type) {
        // Depending on the config item type
        if (type === 'float') {
            // Create a container for the component as well as the info icon
            let floatItemContainerEl = new lx.createElement('DIV', {
                parent: payslipDetailsContainerEl,
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    margin: '15px 0px 0px 0px'
                }
            });
            
            // Display the float item
            let floatItem = new lx.component.Display({
                renderTo: floatItemContainerEl,
                label: label,
                labelAlign: 'left',
                margin: '0px 0px 0px 0px',
                labelWidth: '220px',
                maxWidth: '315px',
            });
            floatItem.setValue(value);
            if (value === null || value === '') {
                floatItem.setValue('-');
            }
            
            // // Is the item the logo coordinates?
            // if( (label === 'Logo X') || (label === 'Logo Y') ) {
            //     // Create the element used to position the tooltip
            //     let floatItemTooltipLocusEl = lx.createElement('DIV', {
            //         parent: floatItemContainerEl,
            //         style: {
            //             position: 'relative',
            //             margin: 'auto 0px 0px 0px',
            //             width: '0px',
            //             height: '30px'
            //         }
            //     });
                
            //     // Create an info icon
            //     let floatItemInfoEl = new lx.createElement('DIV', {
            //         parent: floatItemContainerEl,
            //         style: {
            //             cursor: 'pointer',
            //             display: 'flex',
            //             width: '24px',
            //             minWidth: '24px',
            //             height: '24px',
            //             minHeight: '24px',
            //             margin: 'auto 0px auto 0px',
            //             fontSize: '12px',
            //             color: lx.style.global.backgroundColor,
            //             backgroundColor: '#3B81EB',
            //             borderRadius: '50%'
            //         },
            //         innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
            //     });
                
            //     // Set the info tooltip message depedning on the item
            //     let message = '';
            //     if( label === 'Logo X' ) {
            //         message = 
            //             '<span style="font-size: 12px;">' +  
            //                 'The number of units the logo will be positioned from the left of the payslip.' +
            //             '</span>';
            //     }
            //     else if( label === 'Logo Y' ) {
            //         message = 
            //             '<span style="font-size: 12px;">' +  
            //                 'The number of units the logo will be positioned from the top of the payslip.' +
            //             '</span>';
            //     }
                
            //     // Create the tooltip component
            //     let floatItemInfoTooltip = new lx.component.Tooltip({
            //         renderTo: floatItemTooltipLocusEl,
            //         alignment: 'topLeft',
            //         arrowOffset: '8px',
            //         width: '100%',
            //         maxWidth: '300px',
            //         margin: '5px 10px',
            //         backgroundColor: '#3B81EB', // '#4885F4',
            //         message: message
            //     });
            //     floatItemInfoEl.addEventListener('mouseenter', function() { floatItemInfoTooltip.show(); });
            //     floatItemInfoEl.addEventListener('mouseleave', function() { floatItemInfoTooltip.hide(); });
            // }
        }
        else if (type === 'color') {
            // Create the color picker item
            var colorPickerItemContainerEl = lx.createElement('DIV', {
                parent: payslipDetailsContainerEl,
                className: 'flex-row flex-align-center',
                style: {
                    margin: '15px 0px 0px 0px'
                }
            });
            
            lx.createElement('DIV', {
                parent: colorPickerItemContainerEl,
                style: {
                    width: '220px'
                },
                innerHTML: label
            });
            
            let colorPickerItem = lx.createElement('INPUT', {
                parent: colorPickerItemContainerEl,
                type: 'color',
                style: {
                    maxWidth: '900px'
                }
            });
            colorPickerItem.value = value;
            colorPickerItem.disabled = true;
        }
        else if (type === 'image') {
            // lx.createElement('DIV', {
            //     parent: payslipDetailsContainerEl,
            //     style: {
            //         boxSizing: 'border-box',
            //         display: 'flex',
            //         flexDirection: 'row',
            //         alignItems: 'center',
            //         justifyContent: 'space-between',
            //         width: '100%',
            //         maxWidth: '900px',
            //         padding: '15px 0px 0px 0px',
            //         fontSize: '14px',
            //         color: '#0F0F0F'
            //     },
            //     innerHTML: '<div>' + label + '</div>'
            // });
            
            let wrapColumnLayout = new lx.component.ColumnLayout({
                renderTo: payslipDetailsContainerEl
            });
            
            // Was an image found?
            if( (value !== null) && (value !== '') ) {
                let payslipImageEl = document.createElement('IMG');
                payslipImageEl.style.margin = '0px 0px 0px 0px';
                payslipImageEl.style.minWidth = '200px';
                payslipImageEl.style.maxWidth = '100%';
                // payslipImageEl.style.height = '200px';
                payslipImageEl.style.border = '0.1px solid #DFDFDF';
                payslipImageEl.style.objectFit = 'cover';
                wrapColumnLayout.getContainer(1, 0).appendChild( payslipImageEl );
                payslipImageEl.src = value;
            }
            else {
                new lx.createElement('DIV', {
                    parent: payslipDetailsContainerEl,
                    style: {
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '15px 15px',
                        width: '100%',
                        flex: '1 1 100%',
                        color: lx.style.global.backgroundColor,
                        backgroundColor: '#828282', // '#3C4449',
                        fontSize: '14px',
                        border: '0.1px solid #DFDFDF'
                    },
                    innerHTML: '<div style="margin: auto 0px;">No payslip logo found. Please click on the &apos;Edit&apos; button below to add a logo.</div>'
                });
            }
        }
    }
    
    // Checks if connected to lexpro accounting then loads the config details
    function checkLexproAccountingConnection() {
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=checkConnection',
            onSuccess: function( jsonResult ) {
                var response = JSON.parse(jsonResult);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Failed To Check Lexpro Accounting Connection',
                        message: response.error
                    });
                    loader.hide();
                    return;
                }
                
                let connected = response.connected;
                
                // Clear the existing Lexpro Accunting details
                lexproAccountingDetailsContainerEl.innerHTML = '';
                
                // If connected to the lexpro api this gets the config details
                if( connected ) {
                    lx.sendJSON({
                        url: 'exec.php?c=LexproAccounting&fn=getLexproAccountingConfig',
                        onSuccess: function( jsonResult ) {
                            var response = JSON.parse(jsonResult);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Failed To Load Lexpro Accounting Config',
                                    message: response.error
                                });
                                loader.hide();
                                return;
                            }
                            
                            // Creates a block for a connected status
                            createLexproAccountingPanel(connected, response.configComplete , 'Lexpro Accounting', response.configItems);
                        }
                    });
                }
                else {
                    // Creates an empty block for a disconnected status
                    createLexproAccountingPanel(connected, response.configComplete , 'Lexpro Accounting', []);
                }
            }
        });
    }
    
    // Creates a block for lexpro api
    function createLexproAccountingPanel(isConnected, configComplete, apiName, configItems) {
        let statusColor = '#45A517';
        let connectButtonName = 'Disconnect';
        let showConfigBnt = false;
        let message = 'Connected to Lexpro Accounting';
        
        // Set all settings for every type of status
        if (!isConnected) {
            statusColor = '#DFDFDF';
            connectButtonName = 'Connect';
            message = 'Disconnected from Lexpro Accounting';
        }
        else if (isConnected && !configComplete) {
            statusColor = '#FA8B42';
            showConfigBnt = true;
            message = 'Lexpro Accounting config is incomplete.';
        }
        
        // Create connectionContainerEl
        let connectionContainerEl = lx.createElement('DIV', {
            parent: lexproAccountingDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                flex: '1 1 100%',
                width: '100%',
                // maxWidth: '900px',
                margin: '0px 0px 0px 0px',
                backgroundColor: lx.style.global.backgroundColor, // sectionBackgroundColor,
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
            }
        });
        
        // Create the heading element
        var headingEl = document.createElement('DIV');
        headingEl.className = 'component-flex-row component-flex-align-center';
        headingEl.style.padding = '5px 0px 5px 15px';
        headingEl.style.fontSize = '16px';
        headingEl.style.minHeight = '35px';
        headingEl.style.backgroundColor = lx.style.global.backgroundColor;
        headingEl.style.borderStyle = 'solid';
        headingEl.style.borderColor = '#DFDFDF';
        headingEl.style.borderWidth = '0px 0px 1px 0px';
        headingEl.innerHTML = '<div style="margin: 0px 0px 0px 15px;">' + apiName + '</div>';
        connectionContainerEl.appendChild( headingEl );
        
        // Create the statusEl element
        var statusEl = document.createElement('DIV');
        statusEl.style.width = '10px';
        statusEl.style.height = '10px';
        statusEl.style.borderRadius = '50%';
        statusEl.style.backgroundColor = statusColor;
        headingEl.insertBefore(statusEl, headingEl.firstChild);
        
        // Create the menu dropdown button
        var menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: headingEl,
            margin: '0px 0px 0px auto',
            label: '<i class="fa fa-ellipsis-v"></i>',
            dropdownAlignment: 'right'
        });
        
        // Create the menuDropDownBtnAddEl element
        var menuDropDownBtnConnectionEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-plug" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">' + connectButtonName + '</span>'
        });
        
        // Create menuDropDownBtnConfigEl
        var menuDropDownBtnConfigEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-wrench" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Configuration</span>'
        });
        
        // Create messageContainerEl element
        let messageContainerEl = lx.createElement('DIV', {
            parent: connectionContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                padding: '30px 30px 15px 30px',
                fontSize: '14px',
                flex: '1 1 100%',
                overflow: 'auto'
            },
            innerHTML: message
        });
        
        // Checks if button should be a connect or a config button
        if( connectButtonName === 'Connect' ) {
            menuDropDownBtnConnectionEl.addEventListener('click', lexproAccountingConnectClickEventHandler);
            
            new lx.component.Button({
                renderTo: connectionContainerEl,
                label: 'Connect',
                width: '120px',
                margin: '0px 15px 15px auto',
                
                onClick: lexproAccountingConnectClickEventHandler
            });
        }
        else {
            menuDropDownBtnConnectionEl.addEventListener('click', lexproAccountingDisconnectClickEventHandler);
            
            new lx.component.Button({
                renderTo: connectionContainerEl,
                label: 'Configuration',
                width: '120px',
                margin: '15px 15px 15px auto',
                
                onClick: lexproAccountingConfigBtnClickEventHandler
            });
        }
        
        // Check if connected to the api
        if( isConnected ) {
            // Setup firm details heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Firm Details'
            });
            
            let firmDetailsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup bank details heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Bank Details'
            });
            
            let bankDetailsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup general accounts heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'General Accounts'
            });
            
            let accountsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            // Setup salary accounts heading and section
            new lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    margin: '30px 0px 5px 0px',
                    fontSize: '16px',
                    display: 'block'
                },
                innerHTML: 'Salary Accounts'
            });
            
            let salaryAccountsSectionEl = lx.createElement('DIV', {
                parent: messageContainerEl,
                style: {
                    borderWidth: '1px 0px 0px 0px',
                    borderStyle: 'solid',
                    borderColor: '#DFDFDF', // lx.style.global.color,
                    display: 'block'
                }
            });
            
            let salaryAccountsContainerEl = lx.createElement('DIV', {
                parent: salaryAccountsSectionEl,
                style: {
                    display: 'block'
                }
            });
            
            let employeeAccountsContainerEl = lx.createElement('DIV', {
                parent: salaryAccountsSectionEl,
                style: {
                    display: 'none'
                }
            });
            
            // Add event handler for the edit button
            menuDropDownBtnConfigEl.addEventListener('click', lexproAccountingConfigBtnClickEventHandler);
            
            // Display the connection message
            if( configItems.length !== 0 ) {
                message = message + '</br>';
            }
            
            // Add values to config list
            let displayContainerEl = messageContainerEl;
            for( var i = 0; i < configItems.length; i++ ) {
                let value = configItems[i].value;
                let name = configItems[i].name;
                let accountLabel = '';
                if ( configItems[i].name === 'Firm' ){
                    displayContainerEl = firmDetailsSectionEl;
                    name = 'Firm:';
                }
                else if ( configItems[i].name === 'Bank' ){
                    displayContainerEl = bankDetailsSectionEl;
                    value = configItems[i].bankName;
                    name = 'Bank:';
                }
                else if( configItems[i].name === 'Salary' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    name = 'Salary Account:';
                }
                else if( configItems[i].name === 'includeEmployeeName' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    value = 'No';
                    name = 'Include Employee Name?';
                    if (configItems[i].value) {
                        value = 'Yes';
                    }
                }
                else if( configItems[i].name === 'useSingleSalaryAccount' ) {
                    displayContainerEl = salaryAccountsContainerEl;
                    value = 'No';
                    name = 'Use Single Salary Account?';
                    if( configItems[i].value ) {
                        employeeAccountsContainerEl.style.display = 'none';
                        value = 'Yes';
                    }
                    else {
                        employeeAccountsContainerEl.style.display = 'block';
                    }
                }
                else {
                    if( configItems[i].employeeId === null ) {
                        displayContainerEl = accountsSectionEl;
                        accountLabel = ' Account:';
                    }
                    else {
                        displayContainerEl = employeeAccountsContainerEl;
                        accountLabel = ':';
                    }
                }
                
                // Create config list item
                var configOptionDisplay = new lx.component.Display({
                    renderTo: displayContainerEl,
                    label: name + accountLabel,
                    labelWidth: '230px',
                    fontSize: '14px',
                    margin: '10px 0px 0px 0px'
                });
                configOptionDisplay.setValue( (value !== '' ? value : '-') );
            }
        }
        else {
            // Disable the config button if not connected
            lx.applyStyle(menuDropDownBtnConfigEl, {color: lx.style.global.disabledColor});
        }
        
        // Display the page
        loader.hide();
        
        // messageContainerEl.innerHTML = message;
    }
    
    // Function to update leave request administrator email address
    function updateLeaveRequestAdminEmail( value ) {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=update',
            data: {
                leaveRequestAdminEmailAddress: value
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Other Settings Failed',
                        message: response.error
                    });
                    return;
                }
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
                maxWidth: '980px',
                // maxHeight: '800px',
                margin: '40px auto',
                overflow: 'auto',
                boxShadow: '3px 3px 6px 2px RGB(0, 0, 0, 0.5)'
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
            innerHTML: '<i class="fa fa-fw fa-cog" style="margin: 0px 15px 0px 0px;"></i>First-time Setup'
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
                'Welcome! (' + pageNum + '/' + numPages + ')'
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
        
        // Display a message to the user
        let page1NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage1ContainerEl,
            style: {
                boxSizing: 'border-box',
                // display: 'flex',
                flexDirection: 'row',
                backgroundColor: lx.style.global.backgroundColor,
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px',
                margin: 'auto auto',
                padding: '15px 30px',
                width: '100%',
                textAlign: 'center',
                maxWidth: '800px',
                // borderRadius: '15px'
            }
        });
        
        // new lx.createElement('DIV', {
        //     parent: page1NoteSectionEl,
        //     style: {
        //         margin: 'auto 15px auto 0px',
        //         textAlign: 'center',
        //         fontSize: '32px'
        //     },
        //     innerHTML: '<i class="fas fa-exclamation-triangle" style="margin: auto 10px auto 0px; color: ' + lx.style.global.highlightColor + ';"></i>'
        // });
        
        new lx.createElement('DIV', {
            parent: page1NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                '<div style="text-align: center;">' + 
                    '<span style="font-size: 32px;">Thank you for choosing Payaccsys Payroll!</span>' +
                '</div>' +
                '<div style="text-align: justify; font-size: 16px;margin: 60px 0px 0px 0px;">' + 
                    '<span>' +
                        'Please take some time to complete the required details. Use the \'Next\' and \'Previous\' buttons to ' +
                        'navigate the pages and the \'Finish\' button to complete the process.' +
                    '</span>' +
                '</div>' +
                '<div style="text-align: justify; font-size: 16px;margin: 30px 0px 60px 0px;">' + 
                    '<span>' +
                        'If you are unable to complete all your details at the current time, you can logout and resume where you left off when it\'s more convenient since your data will be saved in real-time as you complete it.' +
                    '</span>' +
                '</div>'
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
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
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
                'Please complete your company details below, ensuring that the information is accurate and up-to-date. ' + 
                'Note that the &apos;Tax Details&apos;, &apos;SARS Contact Person&apos;, and &apos;UIF Contact Person&apos; ' + 
                'sections are required for integration with SARS e@syFile&trade;.'
        });
        
        // Create the company heading element
        var companyHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Company Details</div>'
        });
        
        // // Create addressEditBtn component
        // new lx.component.Button({
        //     renderTo: addressHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: addressDetailsEditBtnClickEventhandler
        // });
        
        // Create company section element
        companySectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the company name display component
        companyNameTxt = new lx.component.Textbox({
            renderTo: companySectionEl,
            label: 'Name: *',
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
            
            onBlur: function( event ) {
                // Don't save if invalid value
                if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "name", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the company name display component
        companyAliasTxt = new lx.component.Textbox({
            renderTo: companySectionEl,
            label: 'Alias: *',
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
            
            onBlur: function( event ) {
                // Don't save if invalid value
                if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "alias", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the company name display component
        companyRegistrationTxt = new lx.component.Textbox({
            renderTo: companySectionEl,
            label: 'Registration Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "registrationNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the address heading element
        var physicalAddressHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Physical Address Details</div>'
        });
        
        // // Create addressEditBtn component
        // new lx.component.Button({
        //     renderTo: physicalAddressHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: addressDetailsEditBtnClickEventhandler
        // });
        
        // Create physical address section element
        physicalAddressSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                //maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        physicalAddressUnitTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Unit',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressUnit", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressComplexTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Complex',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressComplex", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressStreetTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Street',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressStreet", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressSuburbTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Suburb',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressSuburb", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressCityTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'City',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressCity", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Postal Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressPostalCode", event.srcComponent.getValue().trim());
            }
        });
        
        physicalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: physicalAddressSectionEl,
            label: 'Country',
            search: true,
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onChange: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "physicalAddressCountryCode", event.srcComponent.getValue().trim());
            },
            
            onSearch: function() {
                physicalAddressCountrySelect.clear();
                loadCountries( physicalAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( physicalAddressCountrySelect );
            }
        });
        loadCountries( physicalAddressCountrySelect );
        
        // Create the address heading element
        var postalAddressHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Postal Address Details</div>'
        });
        
        // // Create addressEditBtn component
        // new lx.component.Button({
        //     renderTo: postalAddressHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: addressDetailsEditBtnClickEventhandler
        // });
        
        // Create postal address section element
        postalAddressSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 1',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "postalAddressLine1", event.srcComponent.getValue().trim());
            }
        });
        
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 2',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "postalAddressLine2", event.srcComponent.getValue().trim());
            }
        });
        
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 3',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "postalAddressLine3", event.srcComponent.getValue().trim());
            }
        });
        
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Postal Code',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "postalAddressCode", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the contact detailas heading element
        var contactDetailsHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Contact Details</div>'
        });
        
        // // Create addressEditBtn component
        // new lx.component.Button({
        //     renderTo: contactDetailsHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: contactDetailsEditBtnClickEventhandler
        // });
        
        // Create contact details section element
        contactDetailsSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the emailAddressTxt
        emailAddressTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Email Address:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "emailAddress", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the telNumbertxt
        telNumbertxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Telephone Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "telNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the faxNumberTxt
        faxNumberTxt = new lx.component.Textbox({
            renderTo: contactDetailsSectionEl,
            label: 'Fax Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "faxNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the taxHeadingEl element
        var taxHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Tax Details</div>'
        });
        
        // new lx.component.Button({
        //     renderTo: taxHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: companyTaxDetailsEditBtnClickEventhandler
        // });
        
        // Create tax section element
        taxSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the payeReferenceTxt component
        payeReferenceTxt = new lx.component.Textbox({
            renderTo: taxSectionEl,
            label: 'PAYE Reference Number:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "payeReferenceNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the sdlPaymentReferenceTxt component
        sdlPaymentReferenceTxt = new lx.component.Textbox({
            renderTo: taxSectionEl,
            label: 'SDL Payment Reference Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sdlPaymentReferenceNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the uifPaymentReferenceTxt component
        uifPaymentReferenceTxt = new lx.component.Textbox({
            renderTo: taxSectionEl,
            label: 'UIF Payment Reference Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "uifPaymentReferenceNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the uifRegistrationNumberTxt component
        uifRegistrationNumberTxt = new lx.component.Textbox({
            renderTo: taxSectionEl,
            label: 'UIF Registration Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "uifRegistrationNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the standardIndustryClassificationSelect component
        standardIndustryClassificationSelect = new lx.component.Selectbox({
            renderTo: taxSectionEl,
            label: 'Standard Industry Classification:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            search: true,
            
            onSearch: function() {
                standardIndustryClassificationSelect.clear();
                loadSicCodes( standardIndustryClassificationSelect );
            },
            
            onListScrollEnd: function() {
                loadSicCodes( standardIndustryClassificationSelect );
            },
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onChange: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sicCode", event.srcComponent.getValue().trim());
            }
        });
        loadSicCodes( standardIndustryClassificationSelect )
        
        // Create the employmentTaxIncentiveSelect component
        employmentTaxIncentiveSelect = new lx.component.Selectbox({
            renderTo: taxSectionEl,
            label: 'Employment Tax Incentive:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            items: app.commonSelectOptions.etiStatusTypes,
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onChange: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "etiStatusCode", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the specialEconomicZoneSelect component
        specialEconomicZoneSelect = new lx.component.Selectbox({
            renderTo: taxSectionEl,
            label: 'Special Economic Zone:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onChange: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "specialEconomicZoneCode", (event.srcComponent.getValue().trim() !== '' ? event.srcComponent.getValue().trim(): null));
            }
        });
        
        var items = [];
        items.push({ text: 'None', value: '' });
        for (var i = 0; i < app.commonSelectOptions.specialEconomicZones.length; i++) {
            items.push(app.commonSelectOptions.specialEconomicZones[i]);
        }
        specialEconomicZoneSelect.addItems( items );
        specialEconomicZoneSelect.setValue('', 'None');
        
        // Create the diplomaticIndemnityCheckbox component
        diplomaticIndemnityCheckbox = new lx.component.Checkbox({
            renderTo: taxSectionEl,
            label: 'Diplomatic Indemnity:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onClick: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                event.srcComponent.setValue(event.srcComponent.getValue());
                updateCompany( "diplomaticIndemnity", !event.srcComponent.getValue());
            }
        });
        
        // Create the taxHeadingEl element
        var sarsContactHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>SARS Contact Person</div>'
        });
        
        // new lx.component.Button({
        //     renderTo: sarsContactHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: companySarsContactDetailsEditBtnClickEventhandler
        // });
        
        // Create SARS contact section element
        sarsContactSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the sarsContactFirstNameTxt
        sarsContactFirstNameTxt = new lx.component.Textbox({
            renderTo: sarsContactSectionEl,
            label: 'First Name:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sarsContactFirstName", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the sarsContactLastNameTxt
        sarsContactLastNameTxt = new lx.component.Textbox({
            renderTo: sarsContactSectionEl,
            label: 'Last Name:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sarsContactLastName", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the sarsContactEmailTxt
        sarsContactEmailTxt = new lx.component.Textbox({
            renderTo: sarsContactSectionEl,
            label: 'Email Address:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sarsContactEmailAddress", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the sarsContactBusinessNumber
        sarsContactBusinessNumberTxt = new lx.component.Textbox({
            renderTo: sarsContactSectionEl,
            label: 'Contact Business Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sarsContactBusinessNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the sarsContactCellNumber
        sarsContactCellNumberTxt = new lx.component.Textbox({
            renderTo: sarsContactSectionEl,
            label: 'Contact Cell Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "sarsContactCellNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the taxHeadingEl element
        var uifContactHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>UIF Contact Person</div>'
        });
        
        // new lx.component.Button({
        //     renderTo: uifContactHeadingEl,
        //     label: 'Edit',
        //     style: 'text',
            
        //     onClick: companyUifContactDetailsEditBtnClickEventhandler
        // });
        
        // Create UIF contact section element
        uifContactSectionEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the uifContactNameTxt
        uifContactNameTxt = new lx.component.Textbox({
            renderTo: uifContactSectionEl,
            label: 'Name:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "uifContactPerson", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the uifContactEmailTxt
        uifContactEmailTxt = new lx.component.Textbox({
            renderTo: uifContactSectionEl,
            label: 'Email Address:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "uifContactEmailAddress", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the uifContactNumberTxt
        uifContactNumberTxt = new lx.component.Textbox({
            renderTo: uifContactSectionEl,
            label: 'Contact Number:',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the company details
                updateCompany( "uifContactNumber", event.srcComponent.getValue().trim());
            }
        });
        
        // Create the taxHeadingEl element
        var bankAccountHeadingEl = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                // maxWidth: '900px',
                padding: '30px 15px 5px 5px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Banking Details</div>'
        });
        
        new lx.component.Button({
            renderTo: bankAccountHeadingEl,
            label: 'Add',
            style: 'text',
            
            onClick: bankAccountDetailsAddBtnClickEventhandler
        });
        
        // Create banck account section element
        var bankAccountSection = lx.createElement('DIV', {
            parent: wizardPage2ContainerEl,
            style: {
                boxSizing: 'border-box',
                // padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                backgroundColor: sectionBackgroundColor,
                // padding: '15px',
                width: '100%',
                // maxWidth: '900px'
            }
        });
        
        // Create bankAccountsGridMenuOptions array
        var bankAccountsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'},
        ];
        
        // Create bankAccountsGrid component
        bankAccountsGrid = new lx.component.Grid({
            renderTo: bankAccountSection,
            width: '100%',
            height: '200px',
            
            columns: [
                {dataIndex: 'accountNumber', name: 'Account Number', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'bankName', name: 'Bank Name',  width: '150px'},
                {dataIndex: 'bankType', name: 'Bank Type',  width: '150px'},
                {dataIndex: 'branchCode', name: 'Branch Code', width: '110px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: bankAccountsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: function( clickEvent ) {
                if( bankAccountsGrid.getColumnDataIndex( clickEvent.columnIndex ) === 'accountNumber' ) {
                    // Create a modal window
                    var editCompanyBankAccountModal = new lx.component.ModalWindow({
                        margin: '60px',
                        maxWidth: '430px',
                        maxHeight: '417px'
                    });
                    
                    // Create the edit editCompanyDetails panel
                    var editCompanyBankAccountPanel = new app.panel.EditCompanyBankAccount({
                        renderTo: editCompanyBankAccountModal.getContainer(),
                        show: true,
                        companyBankAccountId: clickEvent.record.id,
                        
                        onCancel: function() {
                            app.route.popState();
                        },
                        onSave: function() {
                            app.route.popState();
                            loadCompanyBankDetails(bankAccountsGrid, true);
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    editCompanyBankAccountModal.addEventListener('destroy', function() {
                        editCompanyBankAccountPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    var state = {
                        modal: editCompanyBankAccountModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    editCompanyBankAccountModal.show();
                    editCompanyBankAccountPanel.focus();
                }
            },
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    // Create a modal window
                    var editCompanyBankAccountModal = new lx.component.ModalWindow({
                        margin: '60px',
                        maxWidth: '430px',
                        maxHeight: '417px'
                    });
                    
                    // Create the edit editCompanyDetails panel
                    var editCompanyBankAccountPanel = new app.panel.EditCompanyBankAccount({
                        renderTo: editCompanyBankAccountModal.getContainer(),
                        show: true,
                        companyBankAccountId: bankAccountsGrid.getRow(clickEvent.rowIndex).id,
                        
                        onCancel: function() {
                            app.route.popState();
                        },
                        onSave: function() {
                            app.route.popState();
                            loadCompanyBankDetails( bankAccountsGrid, true );
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    editCompanyBankAccountModal.addEventListener('destroy', function() {
                        editCompanyBankAccountPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    var state = {
                        modal: editCompanyBankAccountModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    editCompanyBankAccountModal.show();
                    editCompanyBankAccountPanel.focus();
                }
                else if(clickEvent.value === 'remove'){
                    
                    new lx.component.Messagebox({
                        message: 
                            'Are you sure you want to remove the \'' + bankAccountsGrid.getRow(clickEvent.rowIndex).bankName + '\' account' ,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the department be removed?
                            if( closeEvent.button === 'remove' ) {
                                // Delete the department
                                lx.sendJSON({
                                    url: 'exec.php?c=Company&fn=removeBank',
                                    data: {
                                        companyBankAccountId: parseInt(bankAccountsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Bank Account Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        loadCompanyBankDetails( bankAccountsGrid, true );
                                        return;
                                    }
                                });
                            }
                            else {
                                return;
                            }
                        }
                    });
                    
                }
            }
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
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
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
                'Leave types will determine what kind of leave is available to employees. Please ensure your leave types ' + 
                'are set up correctly. To add a new leave type simply click on the &apos;Add&apos; button below. ' +
                'You can also edit or remove leave types by clicking on the menu icon ( <i class="fa fa-ellipsis-v"></i> ) ' +
                'to the right of the leave type name.'
        });
        
        // Create the leaveTypeContainerEl element
        leaveTypeContainerEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 1px 0px 1px',
                padding: '15px 15px 15px 15px',
                overflow: 'auto'
            }
        });
        
        // Create the page3ButtonContainerEl element
        let page3ButtonContainerEl = lx.createElement('DIV', {
            parent: wizardPage3ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px 15px 15px 15px',
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 1px 1px',
            }
        });
        
        // Create the addLeaveTypeBtn component
        addLeaveTypeBtn = new lx.component.Button({
            renderTo: page3ButtonContainerEl,
            label: '<i class="fas fa-plus" style="margin: 0px 10px 0px 0px;"></i>Add',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: addLeaveTypeBtnClickEventHandler
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
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
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
                'Please ensure your retirement funds are set up correctly, if you have any. To add a new retirement fund ' + 
                'simply click on the &apos;Add&apos; button below. You can also edit or remove retirement funds by clicking ' + 
                'on the menu icon ( <i class="fa fa-ellipsis-v"></i> ) to the right of the retirement fund name.'
        });
        
        // Create the providentFundContainerEl element
        providentFundContainerEl = lx.createElement('DIV', {
            parent: wizardPage4ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 1px 0px 1px',
                padding: '15px 15px 15px 15px',
                overflow: 'auto'
            }
        });
        
        // Create the page4ButtonContainerEl element
        let page4ButtonContainerEl = lx.createElement('DIV', {
            parent: wizardPage4ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px 15px 15px 15px',
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 1px 1px',
            }
        });
        
        // Create the addProvidentFundBtn component
        addProvidentFundBtn = new lx.component.Button({
            renderTo: page4ButtonContainerEl,
            label: '<i class="fas fa-plus" style="margin: 0px 10px 0px 0px;"></i>Add',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: addProvidentFundBtnClickEventHandler
        });
        
        
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
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
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
                'You can customise your payslip by changing the colour and/or adding your own logo. Click on the &apos;Preview&apos; ' +
                'button to view your payslip or on the &apos;Edit&apos; button update the logo and/or colour.'
        });
        
        payslipDetailsContainerEl = lx.createElement('DIV', {
            parent: wizardPage5ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 1px 0px 1px',
                padding: '15px 120px 15px 120px',
                overflow: 'auto'
            }
        });
        
        // Create the page5ButtonContainerEl element
        let page5ButtonContainerEl = lx.createElement('DIV', {
            parent: wizardPage5ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px 15px 15px 15px',
                backgroundColor: sectionBackgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 1px 1px',
            }
        });
        
        // Create the previewPayslipBtn component
        previewPayslipBtn = new lx.component.Button({
            renderTo: page5ButtonContainerEl,
            // label: '<i class="far fa-window-close" style="margin: 0px 10px 0px 0px;"></i>Close',
            label: '<i class="fas fa-eye" style="margin: 0px 10px 0px 0px;"></i>Preview',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px 0px',
            // style: 'text',
            
            onClick: previewPayslipBtnClickEventHandler
        });
        
        // Create the eidtPayslipLogoBtn component
        editPayslipBtn = new lx.component.Button({
            renderTo: page5ButtonContainerEl,
            label: '<i class="fa fa-pen" style="margin: 0px 10px 0px 0px;"></i>Edit',
            width: '100%',
            maxWidth: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: editPayslipBtnClickEventHandler
        });
        
        
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
                backgroundColor: lx.style.global.backgroundColor,
                padding: '0px 15px 15px 15px',
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
                'Lexpro Payroll integrates with Lexpro Accounting allowing users to export Payroll transactions directly to ' + 
                'Lexpro Accounting. If you have a Lexpro Accounting bookset and want to make use of this feature, please ' + 
                'click on the &apos;Connect&apos; button below to login to your Lexpro Accounting bookset and then click ' + 
                'on the &apos;Configuration&apos; button to select your accounts.'
        });
        
        lexproAccountingDetailsContainerEl = lx.createElement('DIV', {
            parent: wizardPage6ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: sectionBackgroundColor,
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px',
                // padding: '15px 120px 15px 120px',
                overflow: 'auto'
            }
        });
        
        
        //
        // WIZARD PAGE 7
        //
        
        wizardPage7ContainerEl = lx.createElement('DIV', {
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
        
        // Display a message to the user
        let page7NoteSectionEl = lx.createElement('DIV', {
            parent: wizardPage7ContainerEl,
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
            parent: page7NoteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: page7NoteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'Finally, please complete the following miscellaneous settings and click on the &apos;Finish&apos; button ' +
                'to complete the setup.'
        });
        
        // Create the miscellaneousDetailsContainerEl heading element
        miscellaneousDetailsContainerEl = lx.createElement('DIV', {
            parent: wizardPage7ContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxHeight: '100%',
                flex: '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                margin: '0px 0px 0px 0px',
                color: lx.style.global.color,
                backgroundColor: sectionBackgroundColor,
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px',
                padding: '15px 15px 15px 15px',
                overflow: 'auto'
            }
        });
        
        // Create the employees heading element
        new lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                // height: '50px',
                width: '100%',
                // maxWidth: '900px',
                padding: '0px 15px 5px 10px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employees</div>'
        });
        
        // Create the employeesSectionEl element
        let employeesSectionEl = lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let sendBirthdayNotificationsContainerEl = new lx.createElement('DIV', {
            parent: employeesSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the sendBirthdayNotificationsCb component
        sendBirthdayNotificationsCb = new lx.component.Checkbox({
            renderTo: sendBirthdayNotificationsContainerEl,
            label: 'Send Birthday Notifications',
            labelAlign: 'left',
            margin: '0px auto 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            width: '500px',
            
            onChange: sendBirthdayNotificationsCbChangeEventHandler
        });
        
        // Create an info icon
        let sendBirthdayNotificationsInfoEl = new lx.createElement('DIV', {
            parent: sendBirthdayNotificationsContainerEl,
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
        
        // Create the element used to position the tooltip
        let sendBirthdayNotificationsTooltipLocusEl = lx.createElement('DIV', {
            parent: sendBirthdayNotificationsContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let sendBirthdayNotificationsTooltip = new lx.component.Tooltip({
            renderTo: sendBirthdayNotificationsTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'If this option is checked, all employees, apart from the person(s) whose birthday it is, will receive an email notifying them of birthdays on the evening prior to the birthday.' +
                '</span>'
        });
        sendBirthdayNotificationsInfoEl.addEventListener('mouseenter', function() { sendBirthdayNotificationsTooltip.show(); });
        sendBirthdayNotificationsInfoEl.addEventListener('mouseleave', function() { sendBirthdayNotificationsTooltip.hide(); });
        
        // Create the payruns heading element
        new lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                // height: '50px',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 5px 10px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Payruns</div>'
        });
        
        // Create the payrunsSectionEl element
        let payrunsSectionEl = lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let emailPayslipsContainerEl = new lx.createElement('DIV', {
            parent: payrunsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the emailPayslipsCb component
        emailPayslipsCb = new lx.component.Checkbox({
            renderTo: emailPayslipsContainerEl,
            label: 'Email Payslips on Process',
            labelAlign: 'left',
            margin: '0px auto 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            width: '500px',
            
            onChange: emailPayslipsCbChangeEventHandler
        });
        
        // Create an info icon
        let emailPayslipsInfoEl = new lx.createElement('DIV', {
            parent: emailPayslipsContainerEl,
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
        
        // Create the element used to position the tooltip
        let emailPayslipsTooltipLocusEl = lx.createElement('DIV', {
            parent: emailPayslipsContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let emailPayslipsTooltip = new lx.component.Tooltip({
            renderTo: emailPayslipsTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'This signifies the default option for emailing payslips when processing payruns. The option is not enforced and may overridden when the payrun is processed.' +
                '</span>'
        });
        emailPayslipsInfoEl.addEventListener('mouseenter', function() { emailPayslipsTooltip.show(); });
        emailPayslipsInfoEl.addEventListener('mouseleave', function() { emailPayslipsTooltip.hide(); });
        
        // Create the leave request heading element
        new lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                // height: '50px',
                width: '100%',
                // maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                padding: '15px 15px 5px 10px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Requests</div>'
        });
        
        // Create leaveRequestSectionEl element
        let leaveRequestSectionEl = lx.createElement('DIV', {
            parent: miscellaneousDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px 15px',
                width: '100%',
                // maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let leaveRequestAdminEmailContainerEl = new lx.createElement('DIV', {
            parent: leaveRequestSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the company name display component
        leaveRequestAdminEmailTxt = new lx.component.Textbox({
            renderTo: leaveRequestAdminEmailContainerEl,
            fontSize: '14px',
            label: 'Administrator Email Address:',
            labelWidth: '220px',
            labelAlign: 'left',
            margin: '0px auto 0px 0px',
            maxWidth: '600px',
            
            validators: [
                // Make certian it's a valid value
                function(value) {
                    // if( value.trim() === '' ) {
                    //     return 'Value is required';
                    // }
                    return true;
                }
            ],
            
            onBlur: function( event ) {
                // Don't save if invalid value
                // if( event.srcComponent.getValue().trim() === '' ) return;
                
                // Update the leave request adminidtrator email details
                updateLeaveRequestAdminEmail( event.srcComponent.getValue().trim() );
            }
        });
        
        // Create an info icon
        let leaveRequestAdminEmailInfoEl = new lx.createElement('DIV', {
            parent: leaveRequestAdminEmailContainerEl,
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
        
        // Create the element used to position the tooltip
        let leaveRequestAdminEmailTooltipLocusEl = lx.createElement('DIV', {
            parent: leaveRequestAdminEmailContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let leaveRequestAdminEmailTooltip = new lx.component.Tooltip({
            renderTo: leaveRequestAdminEmailTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'The email address of the person responsible for approving and declining leave requests. When a leave request is made an email will be sent to this email address with the option to approve or decline the request.<br><br>' +
                    'If no email address is provided, leave requests may still be approved or declined from the &quot;Leave Requests&quot; section.' +
                '</span>'
        });
        leaveRequestAdminEmailInfoEl.addEventListener('mouseenter', function() { leaveRequestAdminEmailTooltip.show(); });
        leaveRequestAdminEmailInfoEl.addEventListener('mouseleave', function() { leaveRequestAdminEmailTooltip.hide(); });
        
        
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
            // label: '<i class="far fa-window-close" style="margin: 0px 10px 0px 0px;"></i>Close',
            label: '<i class="fas fa-power-off" style="margin: 0px 10px 0px 0px;"></i>Logout',
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
            wizardHeadingEl.innerHTML = 'Welcome! (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage1ContainerEl.style.display = 'flex';
            wizardPage2ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Disable the previous button
            wizardPreviousBtn.disable();
        }
        else if( pageNum === 3 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Company Details (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage2ContainerEl.style.display = 'flex';
            wizardPage3ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
            
            // Focus on the relevant component
            companyNameTxt.focus();
        }
        else if( pageNum === 4 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Leave Setup (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage3ContainerEl.style.display = 'flex';
            wizardPage4ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
        }
        else if( pageNum === 5 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Retirement Fund Setup (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage4ContainerEl.style.display = 'flex';
            wizardPage5ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
        }
        else if( pageNum === 6 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Payslip Setup (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage5ContainerEl.style.display = 'flex';
            wizardPage6ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
        }
        else if( pageNum === 7 ) {
            // Update the page number and heading
            pageNum--;
            wizardHeadingEl.innerHTML = 'Lexpro Accounting Setup (' + pageNum + '/' + numPages + ')';
            
            // Display the previous page
            wizardPage6ContainerEl.style.display = 'flex';
            wizardPage7ContainerEl.style.display = 'none';
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Next<i class="fa fa-chevron-circle-right" style="margin: 0px 0px 0px 10px;"></i>');
        }
    }
    
    // wizardNextBtn click event handler
    function wizardNextBtnClickEventHandler() {
        wizardSectionEl.scrollTop = 0;
        
        // Depending on the page we're on
        if( pageNum === 1 ) {
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Load company details
            lx.sendJSON({
                url: 'exec.php?c=Company&fn=get',
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    
                    // Check if the function was successful.
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to load company details',
                            message: response.error
                        });
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    companyNameTxt.setValue(response.company.details.name);
                    companyAliasTxt.setValue(response.company.details.alias);
                    companyRegistrationTxt.setValue(response.company.details.registrationNumber);
                    
                    // Set physical address details
                    physicalAddressCountrySelect.setValue(response.company.details.physicalAddressCountryCode, response.company.details.physicalAddressCountryName);
                    physicalAddressCityTxt.setValue(response.company.details.physicalAddressCity);
                    physicalAddressSuburbTxt.setValue(response.company.details.physicalAddressSuburb);
                    physicalAddressStreetTxt.setValue(response.company.details.physicalAddressStreet);
                    physicalAddressComplexTxt.setValue(response.company.details.physicalAddressComplex);
                    physicalAddressUnitTxt.setValue(response.company.details.physicalAddressUnit);
                    physicalAddressPostalCodeTxt.setValue(response.company.details.physicalAddressPostalCode);
                    
                    // Set postal address details
                    postalAddressLine1Txt.setValue(response.company.details.postalAddressLine1);
                    postalAddressLine2Txt.setValue(response.company.details.postalAddressLine2);
                    postalAddressLine3Txt.setValue(response.company.details.postalAddressLine3);
                    postalAddressCodeTxt.setValue(response.company.details.postalAddressCode);
                    
                    if( response.company.details.emailAddress !== '' ) {
                        emailAddressTxt.setValue( response.company.details.emailAddress );
                    }
                    else {
                        emailAddressTxt.setValue( '' );
                    }
                    
                    if( response.company.details.telNumber !== '' ) {
                        telNumbertxt.setValue( response.company.details.telNumber );
                    }
                    else {
                        telNumbertxt.setValue( '' );
                    }
                    
                    if( response.company.details.faxNumber !== '' ) {
                        faxNumberTxt.setValue( response.company.details.faxNumber );
                    }
                    else {
                        faxNumberTxt.setValue( '' );
                    }
                    
                    payeReferenceTxt.setValue(response.company.details.payeReferenceNumber);
                    sdlPaymentReferenceTxt.setValue(response.company.details.sdlPaymentReferenceNumber);
                    uifPaymentReferenceTxt.setValue(response.company.details.uifPaymentReferenceNumber);
                    uifRegistrationNumberTxt.setValue(response.company.details.uifRegistrationNumber);
                    standardIndustryClassificationSelect.setValue(response.company.details.sicCode, response.company.details.sicName);
                    employmentTaxIncentiveSelect.setValue(response.company.details.etiStatusCode, response.company.details.etiStatusName);
                    
                    if (response.company.details.specialEconomicZoneCode === null || response.company.details.specialEconomicZoneCode === '') {
                        specialEconomicZoneSelect.setValue(null, 'None');
                    }
                    else {
                        specialEconomicZoneSelect.setValue(response.company.details.specialEconomicZoneCode, response.company.details.specialEconomicZoneName);
                    }
                    
                    diplomaticIndemnityCheckbox.setValue(response.company.details.diplomaticIndemnity);
                    sarsContactFirstNameTxt.setValue(response.company.details.sarsContactFirstName);
                    sarsContactLastNameTxt.setValue(response.company.details.sarsContactLastName);
                    sarsContactEmailTxt.setValue(response.company.details.sarsContactEmailAddress);
                    sarsContactBusinessNumberTxt.setValue(response.company.details.sarsContactBusinessNumber);
                    sarsContactCellNumberTxt.setValue(response.company.details.sarsContactCellNumber);
                    uifContactNameTxt.setValue(response.company.details.uifContactPerson);
                    uifContactEmailTxt.setValue(response.company.details.uifContactEmailAddress);
                    uifContactNumberTxt.setValue(response.company.details.uifContactNumber);
                    
                    loadCompanyBankDetails( bankAccountsGrid, true );
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Company Details (' + pageNum + '/' + numPages+ ')';
                    
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
                    companyNameTxt.focus();
                }
            });
        }
        else if( pageNum === 2 ) {
            // Do sanity checks
            if( companyNameTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('Company name is required.');
                return; 
            }
            else if( companyAliasTxt.getValue().trim() === '' ) {
                wizardNextBtn.showWarning('Company alias is required.');
                return; 
            }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Function to load leave types
            lx.sendJSON({
                url: 'exec.php?c=Leave&fn=getTypeList',
                onSuccess: function( jsonResult ) {
                    var response = JSON.parse(jsonResult);
                    
                    // Check if the function was successful.
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to load leave types',
                            message: response.error
                        });
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    // Clear the existing leave types
                    leaveTypeContainerEl.innerHTML = '';
                    
                    // Were no leave types found?
                    if( response.leaveTypes.length <= 0 ) {
                        // Display note to user
                        new lx.createElement('DIV', {
                            parent: leaveTypeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'
                            },
                            innerHTML: 'No leave types found. Please click on the &apos;Add&apos; button below to add leave types.'
                        });
                        
                        // Update the page number and heading
                        pageNum++;
                        wizardHeadingEl.innerHTML = 'Leave Setup (' + pageNum + '/' + numPages+ ')';
                        
                        // Display the next page
                        wizardPage2ContainerEl.style.display = 'none';
                        wizardPage3ContainerEl.style.display = 'flex';
                        
                        // Enable the previous button
                        wizardPreviousBtn.enable();
                        
                        // Display the page
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    // Add leave type sections
                    for( let i = 0; i < response.leaveTypes.length; i++ ) {
                        // Create the type's container
                        let typeContainerEl = lx.createElement('DIV', {
                            parent: leaveTypeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                maxWidth: '900px',
                                margin: (i > 0 ? '15px 0px 0px 0px' : '0px 0px 0px 0px'),
                                backgroundColor: lx.style.global.backgroundColor,
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                borderColor: '#DFDFDF'
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
                            },
                            innerHTML: '<b>' + response.leaveTypes[i].name + '</b>'
                        });
                        
                        // Create the menu dropdown button
                        let typeDropDownBtn = new lx.component.DropdownButton({
                            renderTo: typeHeadingEl,
                            margin: '0px 0px 0px 5px',
                            label: '<i class="fa fa-ellipsis-v"></i>',
                            dropdownAlignment: 'right'
                        });
                        
                        // Create the menuDropDownBtnAddEl element
                        let typeDropDownBtnEditEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                        });
                        typeDropDownBtnEditEl.addEventListener('click', leaveTypeDropDownBtnEditElClickEventHandler.bind(me, response.leaveTypes[i].id));
                        
                        let typeDropDownBtnDeleteEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                        });
                        typeDropDownBtnDeleteEl.addEventListener('click', leaveTypeDropDownBtnDeleteElClickEventHandler.bind(me, response.leaveTypes[i].id, response.leaveTypes[i].name));
                        
                        // Create an item for each rule
                        for( let j = 0; j < response.leaveTypes[i].rules.length; j++ ) {
                            let rule = response.leaveTypes[i].rules[j];
                            let ruleText = '';
                            
                            // Convert leave to string
                            if( rule.accrualType.code === 'HWOR' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                    ' hours worked.';
                            }
                            else if( rule.accrualType.code === 'DWOR' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                    ' days worked.';
                            }
                            else if( rule.accrualType.code === 'PAYS' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval + 
                                    ' payslips received.';
                            }
                            else if( rule.accrualType.code === 'DCST' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() +
                                    ' of leave at the beginning of every ' + rule.accrualInterval + ' day cycle.';
                            }
                            else if( rule.accrualType.code === 'DCEN' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                    rule.accrualInterval + ' day cycle.';
                            }
                            else if( rule.accrualType.code === 'MCST' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' + 
                                    rule.accrualInterval + ' month cycle.';
                            }
                            else if( rule.accrualType.code === 'MCEN' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                    rule.accrualInterval + ' month cycle.';
                            }
                            else if( rule.accrualType.code === 'YCST' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' + 
                                    rule.accrualInterval + ' year cycle.';
                            }
                            else if( rule.accrualType.code === 'YCEN' ) {
                                ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) + 
                                    ' ' + response.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' + 
                                    rule.accrualInterval + ' year cycle.';
                            }
                            
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '10px 15px'
                                    
                                },
                                innerHTML: ruleText
                            });
                        }
                        
                        let ruleText = '';
                        if (response.leaveTypes[i].rules.length === 0 ) {
                            ruleText = 'This type does not have any rules.';
                            
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '10px 15px'
                                    
                                },
                                innerHTML: ruleText
                            });
                        }
                        
                    }
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Leave Setup (' + pageNum + '/' + numPages+ ')';
                    
                    // Display the next page
                    wizardPage2ContainerEl.style.display = 'none';
                    wizardPage3ContainerEl.style.display = 'flex';
                    
                    // Enable the previous button
                    wizardPreviousBtn.enable();
                    
                    // Display the page
                    loader.hide();
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                }
            });
        }
        else if( pageNum === 3 ) {
            // Do sanity checks
            // if( companyNameTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company name is required.');
            //     return; 
            // }
            // else if( companyAliasTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company alias is required.');
            //     return; 
            // }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Function to load retirement funds
            lx.sendJSON({
                url: 'exec.php?c=ProvidentFund&fn=getList',
                onSuccess: function( jsonResult ) {
                    var response = JSON.parse(jsonResult);
                    
                    // Check if the function was successful.
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to load retirement funds',
                            message: response.error
                        });
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    // Clear the existing provident funds
                    providentFundContainerEl.innerHTML = '';
                    
                    // Were no provident funds found?
                    if( response.providentFunds.length <= 0 ) {
                        // Display note to user
                        new lx.createElement('DIV', {
                            parent: providentFundContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'
                            },
                            innerHTML: 'No retirement funds found. Please click on the &apos;Add&apos; button below to add a retirement fund.'
                        });
                        
                        // Update the page number and heading
                        pageNum++;
                        wizardHeadingEl.innerHTML = 'Retirement Fund Setup (' + pageNum + '/' + numPages+ ')';
                        
                        // Display the next page
                        wizardPage3ContainerEl.style.display = 'none';
                        wizardPage4ContainerEl.style.display = 'flex';
                        
                        // Enable the previous button
                        wizardPreviousBtn.enable();
                        
                        // Display the page
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    // Add retirement funds sections
                    for( let i = 0; i < response.providentFunds.length; i++ ) {
                        // Create the type's container
                        let typeContainerEl = lx.createElement('DIV', {
                            parent: providentFundContainerEl,
                            style: {
                                width: '100%',
                                maxWidth: '900px',
                                margin: (i > 0 ? '15px 0px 0px 0px' : '0px 0px 0px 0px'),
                                backgroundColor: lx.style.global.backgroundColor,
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                borderColor: '#DFDFDF'
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
                            },
                            innerHTML:'<b>' + response.providentFunds[i].providentFundName + '</b>'
                        });
                        
                        // Create the menu dropdown button
                        let typeDropDownBtn = new lx.component.DropdownButton({
                            renderTo: typeHeadingEl,
                            margin: '0px 0px 0px 5px',
                            label: '<i class="fa fa-ellipsis-v"></i>',
                            dropdownAlignment: 'right'
                        });
                        
                        // Create the menuDropDownBtnAddEl element
                        let providentFundTypeEditEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                        });
                        providentFundTypeEditEl.addEventListener('click', providentFundTypeEditElClickEventHandler.bind(me, response.providentFunds[i].id));
                        
                        let providentFundTypeDeleteEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                        });
                        providentFundTypeDeleteEl.addEventListener('click', providentFundTypeDeleteElClickEventHandler.bind(me, response.providentFunds[i].id, response.providentFunds[i].providentFundName));
                        
                        var detailsContainer = lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'
                                
                            }
                        });
                        
                        var fundType = 'Percentage';
                        var sign = '%';
                        if (response.providentFunds[i].providentFundCalculationTypeCode === 'FIXE') {
                            fundType = 'Amount';
                            sign = '';
                        }
                        
                        var employeeAmountDisplay = new lx.component.Display({
                            renderTo: detailsContainer,
                            label: 'Employee ' + fundType + ':',
                            labelWidth: '230px',
                            margin: '0px 0px 0px 0px'
                        });
                        let employeeAmount = response.providentFunds[i].employeeAmount;
                        employeeAmount = (Math.round(employeeAmount * 100) / 100).toFixed(2);
                        employeeAmountDisplay.setValue( employeeAmount + sign);
                        
                        var employerAmountDisplay = new lx.component.Display({
                            renderTo: detailsContainer,
                            label: 'Employer ' + fundType + ':',
                            labelWidth: '230px',
                            margin: '10px 0px 0px 0px'
                        });
                        let employerAmount = response.providentFunds[i].employerAmount;
                        employerAmount = (Math.round(employerAmount * 100) / 100).toFixed(2);
                        employerAmountDisplay.setValue( employerAmount + sign);
                        
                        var enrolledEmployees = new lx.component.Display({
                            renderTo: detailsContainer,
                            label: 'Enrolled Employees:',
                            labelWidth: '230px',
                            margin: '10px 0px 0px 0px'
                        });
                        enrolledEmployees.setValue(response.providentFunds[i].enrolledEmployees);
                    }
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Retirement Fund Setup (' + pageNum + '/' + numPages+ ')';
                    
                    // Display the next page
                    wizardPage3ContainerEl.style.display = 'none';
                    wizardPage4ContainerEl.style.display = 'flex';
                    
                    // Enable the previous button
                    wizardPreviousBtn.enable();
                    
                    // Display the page
                    loader.hide();
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                    
                    // Focus on the relevant component
                    // ...
                }
            });
        }
        else if( pageNum === 4 ) {
            // Do sanity checks
            // if( companyNameTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company name is required.');
            //     return; 
            // }
            // else if( companyAliasTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company alias is required.');
            //     return; 
            // }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Get the default payslip template
            lx.sendJSON({
                url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesList',
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Payslip Templates Failed',
                            message: response.error
                        });
                        
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    payslipTemplateId = null;
                    for( var i = 0; i < response.payslipTemplates.length; i++ ) {
                        if( response.payslipTemplates[i].description === 'Default' ) {
                            payslipTemplateId = response.payslipTemplates[i].id;
                            break;
                        }
                    }
                    
                    if( payslipTemplateId === null ) {
                        new lx.component.Messagebox({
                            title: 'Loading Payslip Templates Failed',
                            message: 'The default payslip template could not be found.'
                        });
                        
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    // Clear the current payslip details
                    payslipDetailsContainerEl.innerHTML = '';
                    
                    // Load the paylsip configuration
                    lx.sendJSON({
                        url: 'exec.php?c=PayslipConfig&fn=getPayslipTemplatesConfig',
                        data: {
                            payslipTemplateId: payslipTemplateId
                        },
                        onSuccess: function( responseText ) {
                            var response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Loading Payslip Config Failed',
                                    message: response.error
                                });
                                loader.hide();
                                wizardNextBtn.hideLoader();
                                wizardNextBtn.enable();
                                return;
                            }
                            
                            payslipImageDirExists = response.clientDataDirExists;
                            if( !payslipImageDirExists ) {
                                new lx.component.Messagebox({
                                    title: 'System Error',
                                    message: 'Company directory not found. Please contact support'
                                });
                            }
                            
                            payslipConfigItems = response.templateConfig;
                            for (var i = 0; i < response.templateConfig.length; i++) {
                                createPayslipConfigItems(response.templateConfig[i].description, response.templateConfig[i].value, response.templateConfig[i].type);
                            }
                            
                            // Update the page number and heading
                            pageNum++;
                            wizardHeadingEl.innerHTML = 'Payslip Setup (' + pageNum + '/' + numPages+ ')';
                            
                            // Display the next page
                            wizardPage4ContainerEl.style.display = 'none';
                            wizardPage5ContainerEl.style.display = 'flex';
                            
                            // Enable the previous button
                            wizardPreviousBtn.enable();
                            
                            // Focus on the relevant component
                            // ...
                            
                            // Display the page
                            loader.hide();
                            wizardNextBtn.hideLoader();
                            wizardNextBtn.enable();
                        }
                    });
                }
            });
        }
        else if( pageNum === 5 ) {
            // Do sanity checks
            // if( companyNameTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company name is required.');
            //     return; 
            // }
            // else if( companyAliasTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company alias is required.');
            //     return; 
            // }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Check if we are already connected to Lexpro Accounting
            lx.sendJSON({
                url: 'exec.php?c=LexproAccounting&fn=checkConnection',
                onSuccess: function( jsonResult ) {
                    var response = JSON.parse(jsonResult);
                    
                    // Was the request not successful?
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Failed To Check Lexpro Accounting Connection',
                            message: response.error
                        });
                        
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    let connected = response.connected;
                    
                    // Clear the existing Lexpro Accunting details
                    lexproAccountingDetailsContainerEl.innerHTML = '';
                    
                    // If connected to the lexpro api this gets the config details
                    if( connected ) {
                        // Get the lexpro accounting configuration
                        lx.sendJSON({
                            url: 'exec.php?c=LexproAccounting&fn=getLexproAccountingConfig',
                            onSuccess: function( jsonResult ) {
                                var response = JSON.parse(jsonResult);
                                
                                // Was the request not successful?
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Failed To Load Lexpro Accounting Configuration',
                                        message: response.error
                                    });
                                    
                                    loader.hide();
                                    wizardNextBtn.hideLoader();
                                    wizardNextBtn.enable();
                                    return;
                                }
                                
                                // Creates a block for a connected status
                                createLexproAccountingPanel(connected, response.configComplete , 'Lexpro Accounting', response.configItems);
                            }
                        });
                    }
                    else {
                        // Creates an empty block for a disconnected status
                        createLexproAccountingPanel(connected, response.configComplete , 'Lexpro Accounting', []);
                    }
                    
                    // Update the page number and heading
                    pageNum++;
                    wizardHeadingEl.innerHTML = 'Lexpro Accounting Setup (' + pageNum + '/' + numPages+ ')';
                    
                    // Display the next page
                    wizardPage5ContainerEl.style.display = 'none';
                    wizardPage6ContainerEl.style.display = 'flex';
                    
                    // Enable the previous button
                    wizardPreviousBtn.enable();
                    
                    // Focus on the relevant component
                    // ...
                    
                    // Display the page
                    // loader.hide();
                    wizardNextBtn.hideLoader();
                    wizardNextBtn.enable();
                }
            });
        }
        else if( pageNum === 6 ) {
            // Do sanity checks
            // if( companyNameTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company name is required.');
            //     return; 
            // }
            // else if( companyAliasTxt.getValue().trim() === '' ) {
            //     wizardNextBtn.showWarning('Company alias is required.');
            //     return; 
            // }
            
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Get the miscellaneous setup details
            lx.sendJSON({
                url: 'exec.php?c=Setup&fn=get',
                onSuccess: function( responseText ) {
                    var response = JSON.parse( responseText );
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading Other Settings Failed',
                            message: response.error
                        });
                        
                        loader.hide();
                        wizardNextBtn.hideLoader();
                        wizardNextBtn.enable();
                        return;
                    }
                    
                    sendBirthdayNotificationsCb.setValue( response.setup.sendBirthdayNotifications );
                    emailPayslipsCb.setValue( response.setup.emailPayslipsOnPayrunProcess );
                    leaveRequestAdminEmailTxt.setValue( (response.setup.leaveRequestAdminEmailAddress !== '-' ? response.setup.leaveRequestAdminEmailAddress : '') );
                    
                    loader.hide();
                }
            });
            
            // Update the page number and heading
            pageNum++;
            wizardHeadingEl.innerHTML = 'Other Settings (' + pageNum + '/' + numPages+ ')';
            
            // Display the next page
            wizardPage6ContainerEl.style.display = 'none';
            wizardPage7ContainerEl.style.display = 'flex';
            
            // Enable the previous button
            wizardPreviousBtn.enable();
            
            // Focus on the relevant component
            // ...
            
            // Change the label of the next button
            wizardNextBtn.setLabel('Finish');
            
            // Display the page
            loader.hide();
            wizardNextBtn.hideLoader();
            wizardNextBtn.enable();
        }
        else if( pageNum === 7 ) {
            // Disable buttons and show loader
            wizardNextBtn.showLoader();
            wizardNextBtn.disable();
            loader.show( false );
            
            // Get the miscellaneous setup details
            lx.sendJSON({
                url: 'exec.php?c=User&fn=completeFirstTimeSetup',
                onSuccess: function( responseText ) {
                    var response = JSON.parse( responseText );
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Completing Setup Failed',
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
    }
    
    // bankAccountDetailsAddBtn click event handler
    function bankAccountDetailsAddBtnClickEventhandler() {
        // Create a modal window
        var addCompanyBankAccountModal = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '430px',
            maxHeight: '417px'
        });
        
        // Create the edit editCompanyDetails panel
        var addCompanyBankAccountPanel = new app.panel.AddCompanyBankAccount({
            renderTo: addCompanyBankAccountModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onAdd: function() {
                app.route.popState();
                loadCompanyBankDetails( bankAccountsGrid, true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addCompanyBankAccountModal.addEventListener('destroy', function() {
            addCompanyBankAccountPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addCompanyBankAccountModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addCompanyBankAccountModal.show();
        addCompanyBankAccountPanel.focus();
    }
    
    // typeDropDownBtnAddEl click event handler
    function addLeaveTypeBtnClickEventHandler() {
        // Create a modal window
        var viewLeaveTypeModel = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '840px',
            maxHeight: '848px'
        });
        
        // Create the editAddressDetailsPanel panel
        var addLeaveTypePanel = new app.panel.AddLeaveType({
            renderTo: viewLeaveTypeModel.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                leaveTypeContainerEl.innerHTML = '';
                loadLeaveTypes();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        viewLeaveTypeModel.addEventListener('destroy', function() {
            addLeaveTypePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: viewLeaveTypeModel
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        viewLeaveTypeModel.show();
        addLeaveTypePanel.focus();
    }
    
    // leaveTypeDropDownBtn click event handler
    function leaveTypeDropDownBtnDeleteElClickEventHandler(leaveTypeId, leaveTypeName) {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=checkRemove',
            data: {
                leaveTypeId: leaveTypeId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        message: response.error
                    });
                    
                    return;
                }
                
                if (!response.deleted) {
                    new lx.component.Messagebox({
                        title: 'Remove Leave Type',
                        message: 'The \'' + leaveTypeName + '\' leave type is in use. Are you sure you want to remove it?',
                        buttons: [
                            {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'remove' ) {
                                lx.sendJSON({
                                    url: 'exec.php?c=Leave&fn=remove',
                                    data: {
                                        leaveTypeId: leaveTypeId
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse( responseText );
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                message: response.error
                                            });
                                            
                                            return;
                                        }
                                        
                                        leaveTypeContainerEl.innerHTML = '';
                                        loadLeaveTypes();
                                    }
                                });
                            }
                        }
                    });
                }
                else {
                    leaveTypeContainerEl.innerHTML = '';
                    loadLeaveTypes();
                }
            }
        });
    }
    
    // leaveTypeDropDownBtn click event handler
    function leaveTypeDropDownBtnEditElClickEventHandler(leaveTypeId) {
        // Create a modal window
        var viewLeaveTypeModel = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '840px',
            maxHeight: '600px'
        });
        
        // Create the editAddressDetailsPanel panel
        var editLeaveTypePanel = new app.panel.EditLeaveType({
            renderTo: viewLeaveTypeModel.getContainer(),
            show: true,
            leaveTypeId: leaveTypeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                leaveTypeContainerEl.innerHTML = '';
                loadLeaveTypes();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        viewLeaveTypeModel.addEventListener('destroy', function() {
            editLeaveTypePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: viewLeaveTypeModel
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        viewLeaveTypeModel.show();
        editLeaveTypePanel.focus();
    }
    
    // addProvidentFundBtn click event handler
    function addProvidentFundBtnClickEventHandler() {
        // Create a modal window
        var addRetirementFundModal = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '430px',
            maxHeight: '419px'
        });
        
        // Create the editAddressDetailsPanel panel
        var addRetirementPanel = new app.panel.AddRetirementFund({
            renderTo: addRetirementFundModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadRetirementFunds();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addRetirementFundModal.addEventListener('destroy', function() {
            addRetirementPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addRetirementFundModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addRetirementFundModal.show();
        addRetirementPanel.focus();
    }
    
    // providentFundTypeEditEl click event handler
    function providentFundTypeEditElClickEventHandler(providentFundId) {
        // Create a modal window
        var editRetirementFundModal = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '430px',
            maxHeight: '419px'
        });
        
        // Create the editAddressDetailsPanel panel
        var editRetirementFundPanel = new app.panel.EditRetirementFund({
            renderTo: editRetirementFundModal.getContainer(),
            show: true,
            providentFundId: providentFundId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadRetirementFunds();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editRetirementFundModal.addEventListener('destroy', function() {
            editRetirementFundPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editRetirementFundModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editRetirementFundModal.show();
        editRetirementFundPanel.focus();
    }
    
    // providentFundTypeDeleteEl click event handler
    function providentFundTypeDeleteElClickEventHandler(providentFundId, providentFundName) {
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=checkRemove',
            data: {
                providentFundId: providentFundId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable To Remove Retirement Fund',
                        message: response.error
                    });
                    
                    return;
                }
                
                new lx.component.Messagebox({
                    title: 'Remove Retirement Fund',
                    message: 'Are you sure you want to remove the ' + providentFundName + ' fund?',
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'remove', label: 'Remove', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'remove' ) {
                            lx.sendJSON({
                                url: 'exec.php?c=ProvidentFund&fn=remove',
                                data: {
                                    providentFundId: providentFundId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Failed To Remove Retirement Fund',
                                            message: response.error
                                        });
                                        
                                        return;
                                    }
                                    
                                    loadRetirementFunds();
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    
    // previewPayslipBtn click event handler
    function previewPayslipBtnClickEventHandler() {
        // Do sanity checks
        if (!payslipImageDirExists) {
            new lx.component.Messagebox({
                title: 'System Error',
                message: 'Company directory not found. Please contact support'
            });
            return;
        }
        
        // Set the configuration
        var configData = [];
        for (var i = 0; i < payslipConfigItems.length; i++) {
            // Depending on th econfiguration type
            if( payslipConfigItems[i].type === 'float' ) {
                if (isNaN(payslipConfigItems[i].value)) {
                    new lx.component.Messagebox({
                        title: 'Unable to preview pdf',
                        message: payslipConfigItems[i].name + ' field needs to be a number'
                    });
                    return;
                }
                
                configData.push({
                    type: payslipConfigItems[i].type,
                    value: payslipConfigItems[i].value,
                    label: payslipConfigItems[i].name
                });
            }
            else if( payslipConfigItems[i].type === 'color' ) {
                configData.push({
                    type: payslipConfigItems[i].type,
                    value: payslipConfigItems[i].value,
                    label: payslipConfigItems[i].name
                });
            }
            else if( payslipConfigItems[i].type === 'image' ) {
                // Don't specify the image so that the saved image will be used
            }
        }
        
        // Open the payslip in a new tab
        lx.sendForm({
            url: 'exec.php?c=PayslipConfig&fn=downloadPayslipPreview',
            target: '_blank',
            data: {
                payslipTemplateId: payslipTemplateId,
                configData: configData
            }
        });
    }
    
    // editPayslipBtn click event handler
    function editPayslipBtnClickEventHandler() {
        // Do sanity checks
        if (!payslipImageDirExists) {
            new lx.component.Messagebox({
                title: 'System Error',
                message: 'Company directory not found. Please contact support'
            });
            return;
        }
        
        // Create a modal window
        let editPayslipSetupModal = new lx.component.ModalWindow({
            margin: '60px',
            maxWidth: '900px',
            maxHeight: '800px'
        });
        
        // Create the editPayslipSetupPanel panel
        let editPayslipSetupPanel = new app.panel.EditPayslipSetup({
            renderTo: editPayslipSetupModal.getContainer(),
            show: true,
            payslipTemplateId: payslipTemplateId,
            payslipTemplateName: 'Default',
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadPayslipDetails();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel
        editPayslipSetupModal.addEventListener('destroy', function() {
            editPayslipSetupPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: editPayslipSetupModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editPayslipSetupModal.show();
        editPayslipSetupPanel.focus();
    }
    
    // Lexpro accounting connect click event handler
    function lexproAccountingConnectClickEventHandler( ) {
        // Create a modal window
        var apiLoginModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '364px'
        });
        
        // Create the edit apiLogin panel
        var apiLoginPanel = new app.panel.LexproAccountingLogin({
            renderTo: apiLoginModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onLogin: function() {
                app.route.popState();
                loader.show();
                lexproAccountingDetailsContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        apiLoginModal.addEventListener('destroy', function() {
            apiLoginPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: apiLoginModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        apiLoginModal.show();
        apiLoginPanel.focus();
    }
    
    // Lexpro accounting disconnect click event handler
    function lexproAccountingDisconnectClickEventHandler( ) {
        loader.show();
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=disconnect',
            onSuccess: function( jsonResult ) {
                var response = JSON.parse(jsonResult);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Failed To Disconnect From Lexpro Accounting',
                        message: response.error
                    });
                    
                    return;
                }
                lexproAccountingDetailsContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
    }
    
    // lexproAccountingConfigBtn click event handler
    function lexproAccountingConfigBtnClickEventHandler () {
        // Create a modal window
        var editApiConfigDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '640px',
            maxHeight: '694px'
        });
        
        // Create the edit editCompanyDetails panel
        var editApiConfigDetailsPanel = new app.panel.EditLexproAccountingConfigDetails({
            renderTo: editApiConfigDetailsModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                lexproAccountingDetailsContainerEl.innerHTML = '';
                checkLexproAccountingConnection();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editApiConfigDetailsModal.addEventListener('destroy', function() {
            editApiConfigDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editApiConfigDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        editApiConfigDetailsModal.show();
        editApiConfigDetailsPanel.focus();
    }
    
    // sendBirthdayNotificationsCb change event handler
    function sendBirthdayNotificationsCbChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=update',
            data: {
                sendBirthdayNotifications: sendBirthdayNotificationsCb.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Other Settings Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // sendBirthdayNotificationsCb change event handler
    function emailPayslipsCbChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=update',
            data: {
                emailPayslipsOnPayrunProcess: emailPayslipsCb.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Other Settings Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};