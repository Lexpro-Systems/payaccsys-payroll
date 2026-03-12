/* globals app, lx */
'use strict';

// EDIT EMPLOYEE PERSONAL DETAILS PANEL
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
app.panel.EditEmployeePersonalDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var personalDetailsSectionEl = null;
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
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    
    var employeeId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
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
    
    function loadCountries( srcSelect ) {
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: {
                searchString: srcSelect.getSearchString(),
                limit: 20,
                offset: srcSelect.getItemCount(),
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
                
                srcSelect.addItems( countries );
            }
        });
    }
    
    function loadEmployee() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
                
                // Set personal details
                titleSelect.setValue( response.employee.titleCode, response.employee.titleName );
                initialsTxt.setValue( response.employee.initials );
                fullNamesTxt.setValue( response.employee.fullNames );
                lastNameTxt.setValue( response.employee.lastName );
                aliasTxt.setValue( response.employee.alias );
                idNumberTxt.setValue( response.employee.idNumber );
                passportNumberTxt.setValue( response.employee.passportNumber );
                passportCountrySelect.setValue( response.employee.passportCountryCode, response.employee.passportCountryName );
                dateOfBirthDate.setValue( response.employee.dateOfBirth );
                asylumSeekerCb.setValue( response.employee.isAsylumSeeker );
                refugeeCb.setValue( response.employee.isRefugee );
                retiredCb.setValue( response.employee.isRetired );
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
            show: false,
            
            employeeId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        employeeId = compConfig.employeeId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Edit Personal Details'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '15px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // PERSONAL DETAILS SECTION
        //
        
        // Create the personalDetailsSectionEl section
        personalDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        titleSelect = new lx.component.Selectbox({
            renderTo: personalDetailsSectionEl,
            label: 'Title'
        });
        
        initialsTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Initials'
        });
        
        fullNamesTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Full Names',
            
            onChange: function() {
                aliasTxt.setValue(fullNamesTxt.getValue());
            }
        });
        
        lastNameTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Last Name'
        });
        
        aliasTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Alias'
        });
        
        idNumberTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'ID Number',
            
            onChange: idNumberTxtChangeEventHandler
        });
        
        passportNumberTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Passport Number'
        });
        
        passportCountrySelect = new lx.component.Selectbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Passport Country',
            search: true,
            
            onSearch: function() {
                passportCountrySelect.clear();
                loadCountries( passportCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( passportCountrySelect );
            }
        });
        loadCountries( passportCountrySelect );
        
        dateOfBirthDate = new lx.component.DateSelect({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Date Of Birth'
        });
        
        asylumSeekerCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Asylum Seeker'
        });
        
        refugeeCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Refugee'
        });
        
        retiredCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Retired'
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the saveBtnContainerEl element
        saveBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Load panel data
        loadTitles();
        loadEmployee();
        
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
        titleSelect.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        me.destroy();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
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
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Check all required values
        if( titleSelect.getValue() === null ) {
            saveBtn.showWarning('The employee title can not be empty.');
            return;
        }
        
        if( initialsTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('The employee initials can not be empty.');
            return;
        }
        
        if( fullNamesTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('The employee full names can not be empty.');
            return;
        }
        
        if( lastNameTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('The employee last name can not be empty.');
            return;
        }
        
        if( aliasTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('The employee alias can not be empty.');
            return;
        }
        
        if( dateOfBirthDate.getValue() === '' || dateOfBirthDate.getValue() === null) {
            saveBtn.showWarning('The employee date of birth can not be empty.');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=update',
            data: {
                employeeId: employeeId,
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
                isRetired: retiredCb.getValue()
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};