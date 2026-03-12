/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST EMPLOYEE DOCUMENTS PANEL
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
app.panel.ListEmployeeDocuments = function(config) {
    
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
    var uploadBtn = null;
    
    var uploadEl = null;
    var documentsGrid = null;
    
    var employeeId = null;
    var latestDocumentId = null;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadDocuments(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = documentsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Document&fn=getDocumentList',
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
                        title: 'Loading Documents Failed',
                        message: response.error
                    });
                }
                
                latestDocumentId = response.latestDocumentId;
                var documents = [];
                for( var i = 0; i < response.documents.length; i++ ) {
                    
                    let fileType = response.documents[i].fileTypeCode;
                    let fileTypeIcon = '';
                    if(fileType === 'PDFF') {
                        fileTypeIcon = '<i class="far fa-file-pdf"></i>';
                    }
                    else if(fileType === 'DOCX' || fileType === 'DOCF') {
                        fileTypeIcon = '<i class="far fa-file-word"></i>';
                    }
                    else if(fileType === 'XLSX' || fileType === 'XLSF') {
                        fileTypeIcon = '<i class="far fa-file-excel"></i>';
                    }
                    else if(fileType === 'CSVF') {
                        fileTypeIcon = '<i class="fas fa-file-csv"></i>';
                    }
                    else if(fileType === 'TXTF') {
                        fileTypeIcon = '<i class="far fa-file"></i>';
                    }
                    else if(fileType === 'PNGF' || fileType === 'JPEG' || fileType === 'SVGF') {
                        fileTypeIcon = '<i class="far fa-file-image"></i>';
                    }
                    else if(fileType === 'ODSF' || fileType === 'JPEG' || fileType === 'ODTF') {
                        fileTypeIcon = '<i class="far fa-file-alt"></i>';
                    }
                    
                    documents.push({
                        id: response.documents[i].id,
                        fileType: fileTypeIcon,
                        description: response.documents[i].description,
                        category: response.documents[i].documentCategoryName,
                        uploadedOn: response.documents[i].uploadedOn,
                        size: formatBytes(response.documents[i].size),
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) documentsGrid.clear();
                
                documentsGrid.addRows( documents );
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
        
        // Create the uploadBtn component
        uploadBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Upload',
            height: '32px',
            width: '120px',
            margin: '0px 15px 0px 0px',
            
            onClick: uploadBtnClickEventHandler
        });
        
        // Create results upload element
        uploadEl = document.createElement('INPUT');
        uploadEl.type = 'file';
        uploadEl.style.position = 'absolute';
        uploadEl.style.top = '-1000px';
        uploadEl.style.left = '-1000px';
        uploadEl.multiple = true;
        // uploadEl.addEventListener('click', me.uploadElEventHandler);
        uploadEl.addEventListener('change', me.uploadElEventHandler);
        el.appendChild( uploadEl );
        
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
        

        
        contentContainerEl.addEventListener('dragenter', contentContainerElDragEnterEventHandler, false);
        contentContainerEl.addEventListener('dragleave', contentContainerElDragLeaveEventHandler, false);
        contentContainerEl.addEventListener('dragover', contentContainerElDragOverEventHandler, false);
        contentContainerEl.addEventListener('drop', contentContainerElDropEventHandler, false);
        
        app.uploadManager.addEventListener('uploadcomplete', uploadCompleteEventHandler);
        
        // Create documentsGridMenuOptions array
        var documentsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download', value: 'download'},
            {name: '<i class="fas fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'},
        ];
        
        // Create documentsGrid component
        documentsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'fileType', name: '', padding: '0px 0px 0px 20px', width: '50px'},
                {dataIndex: 'description', name: 'Description', minWidth: '200px', type: 'button'},
                {dataIndex: 'category', name: 'Category', width: '200px'},
                {dataIndex: 'uploadedOn', name: 'Uploaded On', width: '150px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'size', name: 'Size', width: '100px', alignment: 'right'},
                {dataIndex: 'menu', name: '', type: 'menu', options: documentsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: documentsGridCellClickEventHandler,
            
            onScrollEnd: documentsGridScrollEndEventHandler,
            
            onMenuItemClick: documentsGridMenuItemClickEventHandler
            
        });
        
        employeeId = compConfig.employeeId;
        
        // Load documents
        loadDocuments(false);
        
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
    function uploadCompleteEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Document&fn=getDocumentList',
            data: {
                employeeId: employeeId,
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: documentsGrid.getRowCount(),
                sortOrder: 'ASC',
                documentId: latestDocumentId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Documents Failed',
                        message: response.error
                    });
                }
                latestDocumentId = response.latestDocumentId;
                
                for( var i = 0; i < response.documents.length; i++ ) {
                    
                    let fileType = response.documents[i].fileTypeCode;
                    let fileTypeIcon = '';
                    if(fileType === 'PDFF') {
                        fileTypeIcon = '<i class="far fa-file-pdf"></i>';
                    }
                    else if(fileType === 'DOCX' || fileType === 'DOCF') {
                        fileTypeIcon = '<i class="far fa-file-word"></i>';
                    }
                    else if(fileType === 'XLSX' || fileType === 'XLSF') {
                        fileTypeIcon = '<i class="far fa-file-excel"></i>';
                    }
                    else if(fileType === 'CSVF') {
                        fileTypeIcon = '<i class="fas fa-file-csv"></i>';
                    }
                    else if(fileType === 'TXTF') {
                        fileTypeIcon = '<i class="far fa-file"></i>';
                    }
                    else if(fileType === 'PNGF' || fileType === 'JPEG' || fileType === 'SVGF') {
                        fileTypeIcon = '<i class="far fa-file-image"></i>';
                    }
                    else if(fileType === 'ODSF' || fileType === 'JPEG' || fileType === 'ODTF') {
                        fileTypeIcon = '<i class="far fa-file-alt"></i>';
                    }
                    documentsGrid.insertRows( 0,
                        {
                            id: response.documents[i].id,
                            fileType: fileTypeIcon,
                            description: response.documents[i].description,
                            category: response.documents[i].documentCategoryName,
                            uploadedOn: response.documents[i].uploadedOn,
                            size: formatBytes(response.documents[i].size),
                            menu: '<i class="fa fa-ellipsis-v"></i>',
                            spacer: ''
                        });
                }
                
            }
        });
    }
    
    me.uploadElEventHandler = function() {
        let showError = false;
        let fileList = '';
        
        let allowedExtenstions = ['csv', 'doc', 'docx', 'jpeg', 'jpg', 'ods', 'odt', 'pdf', 'png', 'jpeg', 'txt', 'xls', 'xlsx'];
        
        for (var i = 0; i < uploadEl.files.length; i++) {
            // Was a valid file received?
            if (typeof uploadEl.files[i] != "undefined") {
                
                let fileExtenstion = uploadEl.files[i].name.split('.').pop();
                
                // Is the file larger than the limit?
                var fileSize = uploadEl.files[i].size / 1024 / 1024;
                if(fileSize > 50) {
                    fileList = fileList + '</br>' + uploadEl.files[i].name + ' exceeds the 50mb limit.';
                    showError = true;
                    continue;
                }
                
                // Is the file extenstion correct
                let invalidFile = true;
                for (var x = 0; x < allowedExtenstions.length; x++) {
                    if (allowedExtenstions[x] === fileExtenstion) {
                        invalidFile = false;
                        break;
                    }
                }
                
                if (invalidFile) {
                    fileList = fileList + '</br>' + uploadEl.files[i].name + ' has an invalid file extension of ' + fileExtenstion + '.';
                    showError = true;
                    continue;
                }
                
                app.uploadManager.queueUpload('exec.php?c=Document&fn=uploadDocument', {employeeId: employeeId}, uploadEl.files[i]);
            }
        }
        
        // Checks if a file was invalid
        if (showError) {
            let message = 'The following files failed to upload: </br>';
            new lx.component.Messagebox({
                title: 'Unable to upload file',
                message: message + fileList,
                icon: 'icon_error',
                
                buttons: [
                    {name: 'ok', label: 'Ok'}
                ]
            });
        }
        
    };
    
    // contentContainerEl dragenter event handler
    function contentContainerElDragEnterEventHandler( event ) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // contentContainerEl dragLeave event handler
    function contentContainerElDragLeaveEventHandler( event ) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // contentContainerEl dragover event handler
    function contentContainerElDragOverEventHandler( event ) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // contentContainerEl drop event handler
    function contentContainerElDropEventHandler( event ) {
        let showError = false;
        let fileList = '';
        let allowedExtenstions = ['csv', 'doc', 'docx', 'jpeg', 'jpg', 'ods', 'odt', 'pdf', 'png', 'jpeg', 'txt', 'xls', 'xlsx'];
        
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
            // Was a valid file received?
            if (typeof event.dataTransfer.files[i] != "undefined") {
                
                let fileExtenstion = uploadEl.files[i].name.split('.').pop();
                
                // Is the file larger than the limit?
                var fileSize = event.dataTransfer.files[i].size / 1024 / 1024;
                if(fileSize > 50) {
                    fileList = fileList + '</br>' + event.dataTransfer.files[i].name + ' exceeds the 50mb limit.';
                    showError = true;
                    continue;
                }
                
                // Is the file extenstion correct
                let invalidFile = true;
                for (var x = 0; x < allowedExtenstions.length; x++) {
                    if (allowedExtenstions[x] === fileExtenstion) {
                        invalidFile = false;
                        break;
                    }
                }
                
                if (invalidFile) {
                    fileList = fileList + '</br>' + uploadEl.files[i].name + ' has an invalid file extension of ' + fileExtenstion + '.';
                    showError = true;
                    continue;
                }
                
                app.uploadManager.queueUpload('exec.php?c=Document&fn=uploadDocument', {employeeId: employeeId}, event.dataTransfer.files[i]);
            }
        }
        
        // Checks if a file was invalid
        if (showError) {
            let message = 'The following files failed to upload: </br>';
            new lx.component.Messagebox({
                title: 'Unable to upload file',
                message: message + fileList,
                icon: 'icon_error',
                
                buttons: [
                    {name: 'ok', label: 'Ok'}
                ]
            });
        }
        
        event.preventDefault();
        event.stopPropagation();
    }
    
    function onSearchEventHandler (){
        loadDocuments(true);
    }
    
    function onSearchResetBtnClickEventHandler() {
        searchTxt.setValue('');
        loadDocuments(true);
    }
    
    function uploadBtnClickEventHandler() {
        if( uploadEl.click ) uploadEl.click();
        else if( uploadEl.dispatchEvent ) uploadEl.dispatchEvent( new Event('click') );
    }
    
    function documentsGridMenuItemClickEventHandler(clickEvent) {
        if( clickEvent.value === 'download' ) {
            lx.sendForm({
                url: 'exec.php?c=Document&fn=download',
                target: '_self',
                data: {
                    documentId: documentsGrid.getRow(clickEvent.rowIndex).id,
                }
            });
        }
        else if(clickEvent.value === 'edit'){
            // Create a modal window
            var editDocumentModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '297px'
            });
            
            // Create the editDocumentPanel panel
            var editDocumentPanel = new app.panel.EditDocument({
                renderTo: editDocumentModal.getContainer(),
                show: true,
                
                documentId: documentsGrid.getRow(clickEvent.rowIndex).id,
            
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    loadDocuments(true);
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editDocumentModal.addEventListener('destroy', function() {
                editDocumentPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editDocumentModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editDocumentModal.show();
            editDocumentPanel.focus();
        }
        else if(clickEvent.value === 'remove'){
            
            new lx.component.Messagebox({
                message: 
                'Are you sure you want to remove \'' + documentsGrid.getRow(clickEvent.rowIndex).description + '\'.',
                    
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'remove', label: 'Remove', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    if( closeEvent.button === 'remove' ) {
                        
                        lx.sendJSON({
                            url: 'exec.php?c=Document&fn=removeDocument',
                            data: {
                                documentId: parseInt(documentsGrid.getRow(clickEvent.rowIndex).id)
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Removing Document Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                loadDocuments(true);
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
    
    function documentsGridScrollEndEventHandler() {
        loadDocuments(false);
    }
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        let decimals = 2;
        let k = 1024;
        let dm = decimals;
        
        if (decimals < 0) {
            dm = 0;
        }
        
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        let i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    function documentsGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
            // Create a modal window
            var editDocumentModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '297px'
            });
            
            // Create the editDocumentPanel panel
            var editDocumentPanel = new app.panel.EditDocument({
                renderTo: editDocumentModal.getContainer(),
                show: true,
                
                documentId: documentsGrid.getRow(event.rowIndex).id,
            
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    loadDocuments(true);
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editDocumentModal.addEventListener('destroy', function() {
                editDocumentPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editDocumentModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editDocumentModal.show();
            editDocumentPanel.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};