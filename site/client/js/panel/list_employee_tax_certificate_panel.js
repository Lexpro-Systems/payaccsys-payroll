/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST EMPLOYEE TAX DOCUMENTS
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
app.panel.ListEmployeeTaxCertificate = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var titleContainerEl = null;
    var searchTxt = null;
    
    var taxCertificatesGrid = null;
    
    var employeeId = null;
    var latestDocumentId = null;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadTaxCertificates(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = taxCertificatesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=getList',
            data: {
                employeeId: employeeId,
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Certificates Failed',
                        message: response.error
                    });
                }
                
                latestDocumentId = response.latestDocumentId;
                var taxCertificates = [];
                for( var i = 0; i < response.certificates.length; i++ ) {
                    taxCertificates.push({
                        id: response.certificates[i].id,
                        employeeEmailAddress: response.certificates[i].employeeEmailAddress,
                        number: response.certificates[i].number,
                        taxYear: response.certificates[i].taxYear,
                        typeName: response.certificates[i].typeName,
                        periodName: response.certificates[i].periodName,
                        generatedOn: response.certificates[i].generatedOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) taxCertificatesGrid.clear();
                
                taxCertificatesGrid.addRows( taxCertificates );
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
                margin: '15px 0px 15px 0px'
            }
        });
        
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 15px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
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
        // EXAMPLE SECTION
        //
        
        // Create taxCertificatesGridMenuOptions array
        var taxCertificatesGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download', value: 'download'},
            {name: '<i class="fas fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email To', value: 'emailTo'}
        ];
        
        // Create taxCertificatesGrid component
        taxCertificatesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'number', name: 'Certificate Number', type: 'button', minWidth: '260px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'taxYear', name: 'Tax Period', width: '110px'},
                {dataIndex: 'typeName', name: 'Type', width: '110px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'periodName', name: 'Period', width: '110px'},
                {dataIndex: 'generatedOn', name: 'Created On', width: '180px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: taxCertificatesGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: taxCertificatesGridCellClickEventHandler,
            
            onScrollEnd: taxCertificatesGridScrollEndEventHandler,
            
            onMenuItemClick: taxCertificatesGridMenuItemClickEventHandler
            
        });
        
        employeeId = compConfig.employeeId;
        
        // Load documents
        loadTaxCertificates(false);
        
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
    
    
    function onSearchEventHandler (){
        loadTaxCertificates(true);
    }
    
    function onSearchResetBtnClickEventHandler() {
        searchTxt.setValue('');
        loadTaxCertificates(true);
    }
    
    function taxCertificatesGridMenuItemClickEventHandler(clickEvent) {
        if( clickEvent.value === 'download' ) {
            lx.sendForm({
                url: 'exec.php?c=TaxCertificate&fn=download',
                target: '_blank',
                data: {
                    taxCertificateId: parseInt(taxCertificatesGrid.getRow(clickEvent.rowIndex).id)
                }
            });
        }
        else if(clickEvent.value === 'view'){
            config.viewEmployeePanel.hide();
            
            var viewEmployeeTaxCertificatePanel = new app.panel.ViewEmployeeTaxCertificate({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                taxCertificateId: parseInt(taxCertificatesGrid.getRow(clickEvent.rowIndex).id),
                viewEmployeePanel: config.viewEmployeePanel,
                employeeName: config.employeeName,
                emailAddress: taxCertificatesGrid.getRow(clickEvent.rowIndex).employeeEmailAddress
                
            });
            
            var panelState = {
                previousPanel: me,
                panel: viewEmployeeTaxCertificatePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if (clickEvent.value === 'emailTo') {
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
                taxCertificateId: parseInt(taxCertificatesGrid.getRow(clickEvent.rowIndex).id),
                emailAddress: taxCertificatesGrid.getRow(clickEvent.rowIndex).employeeEmailAddress,
                
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
    
    function taxCertificatesGridScrollEndEventHandler() {
        loadTaxCertificates(false);
    }
    
    function taxCertificatesGridCellClickEventHandler( event ) {
            
        // Depending on the column clicked
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'number' ) {
            config.viewEmployeePanel.hide();
            
            var viewEmployeeTaxCertificatePanel = new app.panel.ViewEmployeeTaxCertificate({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                taxCertificateId: taxCertificatesGrid.getRow(event.rowIndex).id,
                viewEmployeePanel: config.viewEmployeePanel,
                employeeName: config.employeeName,
                emailAddress: taxCertificatesGrid.getRow(event.rowIndex).employeeEmailAddress
            });
            
            var panelState = {
                previousPanel: me,
                panel: viewEmployeeTaxCertificatePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
        }
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};