/* globals app, lx */
'use strict';


// VIEW BOOKSET PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//  employeeAccountId:           Account id of the employee to view
//  employeeAccountName:         Name of the employee account
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ViewEmployeeAccount = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var editBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var detailsHeading = null;
    var detailsSectionEl = null;
    var nameDisplay = null;
    var emailDisplay = null;
    var createdDisplay = null;
    
    var verificationContainerDetailsHeadingEl = null;
    
    var profileAccessDetailsHeadingEl = null;
    var profileAccessDetailsSectionEl = null;
    var profileAccessGrid = null;
    
    
    var employeeAccountId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load company data
    function loadEmployeeAccount() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeAccountId: employeeAccountId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                    app.route.popState();
                    return;
                }
                
                titleTextEl.innerHTML = 'View Employee Account: ' + response.employeeAccount.firstName + ' ' + response.employeeAccount.lastName;
                
                nameDisplay.setValue(response.employeeAccount.firstName + ' ' + response.employeeAccount.lastName);
                emailDisplay.setValue(response.employeeAccount.emailAddress);
                createdDisplay.setValue(response.employeeAccount.createdOn);
                
                var profileAccess = [];
                for( let i = 0; i < response.employeeAccount.profileAccess.length; i++ ) {
                    
                    profileAccess.push({
                        grantedOn: response.employeeAccount.profileAccess[i].grantedOn,
                        companyName: response.employeeAccount.profileAccess[i].companyName,
                        idNumber: response.employeeAccount.profileAccess[i].idNumber,
                        passportNumber: response.employeeAccount.profileAccess[i].passportNumber
                        // menu: '<i class="fa fa-ellipsis-v"></i>',
                        // spacer: ''
                    });
                }
                
                profileAccessGrid.addRows( profileAccess );
                
                for (let i = 0; i < response.employeeAccount.verification.length; i++) {
                    // Create the emailDisplay component
                    let verificationCodeDisplay = new lx.component.Display({
                        renderTo: verificationContainerDetailsHeadingEl,
                        margin: '15px 0px 0px 0px',
                        label: 'Verification Code:',
                        labelAlign: 'left',
                        labelWidth: '220px',
                        maxWidth: '500px'
                    });
                    
                    verificationCodeDisplay.setValue(response.employeeAccount.verification[i].code);
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
            employeeAccountId: null,
            employeeAccountName: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        
        // Initialize state
        confirmDestroy = false;
        employeeAccountId = compConfig.employeeAccountId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
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
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
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
            innerHTML: 'View Employee Account: ' + compConfig.employeeAccountName
        });
        
        // Create add button
        editBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Edit',
            margin: '0px 20px 0px auto',
            
            onClick: editBtnClickEventHandler
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
                padding: '0px 15px 15px 15px'
            }
        });
        
        
        //
        // COMPANY DETAILS SECTION
        //
        
        // Create the detailsHeading element
        detailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Details</div>'
        });
        
        // Create the detailsSectionEl
        detailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the nameDisplay component
        nameDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the emailDisplay component
        emailDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Email Address',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the createdDisplay component
        createdDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Created On',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        verificationContainerDetailsHeadingEl = lx.createElement('DIV', {
            parent: detailsSectionEl
        });
        //
        // EMPLOYEE ACCOUNT EMPLOYEE PROFILE ACCESS SECTION
        //
        
        // Create the profileAccessDetailsHeadingEl element
        profileAccessDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Linked Employee Profiles</div>'
        });
        
        // Create profileAccessDetailsSectionEl element
        profileAccessDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        // Create companiesGrid component
        profileAccessGrid = new lx.component.Grid({
            renderTo: profileAccessDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'grantedOn', name: 'Granted On', padding: '0px 0px 0px 15px'},
                {dataIndex: 'companyName', name: 'Company Name', width: '200px'},
                {dataIndex: 'idNumber', name: 'ID Number', width: '120px'},
                {dataIndex: 'passportNumber', name: 'Passport', width: '120px'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            // onCellClick: companiesGridCellClickEventHandler
        });
        
        // Load form data
        loadEmployeeAccount();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        
    };
    
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
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
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    
    // Edit button click event handler
    function editBtnClickEventHandler() {
        // console.log(me);
        me.hide();
        
        var editEmployeeAccountPanel = new app.panel.EditEmployeeAccount({
            renderTo: app.mainPanel.getContainer(),
            
            employeeAccountId: employeeAccountId,
            
            onSave: function() {
                profileAccessGrid.clear();
                verificationContainerDetailsHeadingEl.innerHTML = '';
                loadEmployeeAccount();
                app.route.popState();
            }
        });
        editEmployeeAccountPanel.focus();
        
        var panelState = {
            previousPanel: me,
            panel: editEmployeeAccountPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        editEmployeeAccountPanel.show();
        editEmployeeAccountPanel.focus();
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};