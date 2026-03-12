/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST TAX RECONCILIATION CERTIFICATES PANEL
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
app.panel.ListTaxReconciliationCertificates = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var searchTxt = null;
    var emailBtn = null;
    var selfServiceAccessBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var certificatesGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load tax certificates from the database
    function loadTaxCertificates( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = certificatesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                reconciliationId: config.reconciliationId,
                employeeId: null
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Certificates Failed',
                        message: response.error
                    });
                }
                
                // Setup the grid rows
                var certificates = [];
                for( var i = 0; i < response.certificates.length; i++ ) {
                    let selfServiceAccess = 'No';
                    if( response.certificates[i].selfServiceAccess ) {
                        selfServiceAccess = 'Yes';
                    }
                    
                    certificates.push({
                        id: response.certificates[i].id,
                        number: response.certificates[i].number,
                        typeCode: response.certificates[i].typeCode,
                        typeName: response.certificates[i].typeName,
                        employeeId: response.certificates[i].employeeId,
                        employeeName: response.certificates[i].employeeName,
                        employeeEmailAddress: response.certificates[i].employeeEmailAddress,
                        selfServiceAccess: selfServiceAccess,
                        taxYear: response.certificates[i].taxYear,
                        taxYearDescription: ((response.certificates[i].taxYear - 1) + ' / ' + response.certificates[i].taxYear),
                        periodCode: response.certificates[i].periodCode,
                        periodName: response.certificates[i].periodName,
                        generatedOn: response.certificates[i].generatedOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) certificatesGrid.clear();
                
                // Add the rows to the grid
                certificatesGrid.addRows( certificates );
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
            
            reconciliationId: null
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
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 0px 0px',
                margin: '15px 0px 0px 0px'
            }
        });
        
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '280px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 20px 0px 20px',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        // Create the emailBtn component
        emailBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Email Certificates',
            height: '32px',
            width: '140px',
            margin: '0px 20px 0px auto',
            
            onClick: emailBtnClickEventHandler
        });
        
        // Create the emailBtn component
        selfServiceAccessBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Self Service Access',
            height: '32px',
            width: '150px',
            margin: '0px 20px 0px 0px',
            
            onClick: selfServiceAccessBtnClickEventHandler
        });
        // selfServiceAccessBtn.disable();
        
        
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
        loader.show( true );
        
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
                padding: '15px'
            }
        });
        
        // Create certificatesGridMenuOptions array
        var certificatesGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download', value: 'download'},
            {name: '<i class="fas fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email To', value: 'emailTo'}
        ];
        
        // Create certificatesGrid component
        certificatesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'number', name: 'Certificate Number',  width: '280px', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'employeeName', name: 'Employee', minWidth: '100px', type: 'button'},
                {dataIndex: 'typeName', name: 'Type', width: '100px'},
                {dataIndex: 'selfServiceAccess', name: 'Self Service', width: '90px'},
                // {dataIndex: 'taxYearDescription', name: 'Tax Year', width: '100px'},
                // {dataIndex: 'periodName', name: 'Period', width: '110px', padding: '0px 0px 0px 20px'},
                // {dataIndex: 'generatedOn', name: 'Created On', width: '180px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: certificatesGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: certificatesGridCellClickEventHandler,
            onScrollEnd: certificatesGridScrollEndEventHandler,
            onMenuItemClick: certificatesGridMenuItemClickEventHandler
        });
        
        // Load the tax certificates
        loadTaxCertificates( true );
        
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
        searchTxt.focus();
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
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show( true );
        loadTaxCertificates( true );
    }
    
    // On search resetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show( true );
        searchTxt.setValue('');
        loadTaxCertificates( true );
    }
    
    // certificatesGrid scroll end event handler
    function certificatesGridScrollEndEventHandler() {
        loadTaxCertificates( false );
    }
    
    // certificatesGrid menu item click event handler
    function certificatesGridMenuItemClickEventHandler( event ) {
        if( event.value === 'download' ) {
            lx.sendForm({
                url: 'exec.php?c=TaxCertificate&fn=download',
                target: '_blank',
                data: {
                    taxCertificateId: parseInt(certificatesGrid.getRow(event.rowIndex).id)
                }
            });
        }
        else if(event.value === 'view'){
            config.viewTaxReconciliationPanel.hide();
            
            var viewEmployeeTaxCertificatePanel = new app.panel.ViewEmployeeTaxCertificate({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                taxCertificateId: parseInt(certificatesGrid.getRow(event.rowIndex).id),
                employeeName: certificatesGrid.getRow(event.rowIndex).employeeName,
                emailAddress: certificatesGrid.getRow(event.rowIndex).employeeEmailAddress
                
            });
            
            let panelState = {
                previousPanel: config.viewTaxReconciliationPanel,
                panel: viewEmployeeTaxCertificatePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if (event.value === 'emailTo') {
            // Create a modal window
            var mailToModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '232px'
                
            });
            
            // Create the mailToPanel panel
            var mailToPanel = new app.panel.MailTo({
                renderTo: mailToModal.getContainer(),
                show: true,
                taxCertificateId: parseInt(certificatesGrid.getRow(event.rowIndex).id),
                emailAddress: certificatesGrid.getRow(event.rowIndex).employeeEmailAddress,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onSend: function() {
                    app.route.popState();
                    
                    new lx.component.Messagebox({
                        title: 'Email Tax Certificate',
                        message: 'The email was sent successfully.'
                    });
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            mailToModal.addEventListener('destroy', function() {
                mailToPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: mailToModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            mailToModal.show();
            mailToPanel.focus();
        }
    }
    
    // certificatesGrid cell click event handler 
    function certificatesGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'number' ) {
            config.viewTaxReconciliationPanel.hide();
            
            var viewEmployeeTaxCertificatePanel = new app.panel.ViewEmployeeTaxCertificate({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                taxCertificateId: certificatesGrid.getRow(event.rowIndex).id,
                employeeName: certificatesGrid.getRow(event.rowIndex).employeeName,
                emailAddress: certificatesGrid.getRow(event.rowIndex).employeeEmailAddress
            });
            
            let panelState = {
                previousPanel: config.viewTaxReconciliationPanel,
                panel: viewEmployeeTaxCertificatePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
        }
        else if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'employeeName' ) {
            config.viewTaxReconciliationPanel.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: certificatesGrid.getRow(event.rowIndex).employeeId,
                employeeName: certificatesGrid.getRow(event.rowIndex).employeeName
            });
            
            let panelState = {
                previousPanel: config.viewTaxReconciliationPanel,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    // emailBtn click event handler
    function emailBtnClickEventHandler() {
        // Create a modal window
        var emailTaxCertificatesModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '1024px',
            maxHeight: '1024px'
        });
        
        // Create the emailTaxCertificatesPanel panel
        var emailTaxCertificatesPanel = new app.panel.EmailTaxCertificates({
            renderTo: emailTaxCertificatesModal.getContainer(),
            reconciliationId: parseInt(config.reconciliationId),
            show: true,
            
            onSend: function() {
                app.route.popState();
                new lx.component.Messagebox({
                    title: 'Email Tax Certificates',
                    message: 'The emails were sent successfully.'
                });
            },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        emailTaxCertificatesModal.addEventListener('destroy', function() {
            emailTaxCertificatesPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: emailTaxCertificatesModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        emailTaxCertificatesModal.show();
        emailTaxCertificatesPanel.focus();
    }
    
    // selfServiceAccessBtn click event handler
    function selfServiceAccessBtnClickEventHandler() {
        // Create a modal window
        var taxCertificateSelfServiceAccessModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '1024px',
            maxHeight: '100%'
        });
        
        // Create the taxCertificateSelfServiceAccessPanel panel
        var taxCertificateSelfServiceAccessPanel = new app.panel.TaxCertificateSelfServiceAccess({
            renderTo: taxCertificateSelfServiceAccessModal.getContainer(),
            reconciliationId: parseInt(config.reconciliationId),
            show: true,
            
            onApply: function() {
                loadTaxCertificates( true );
                app.route.popState();
            },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        taxCertificateSelfServiceAccessModal.addEventListener('destroy', function() {
            taxCertificateSelfServiceAccessPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: taxCertificateSelfServiceAccessModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        taxCertificateSelfServiceAccessModal.show();
        taxCertificateSelfServiceAccessPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};