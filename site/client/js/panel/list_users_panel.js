/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST USERS PANEL
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
app.panel.ListUsers = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    var addBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var usersGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to reload load user grid
    function loadUserGrid() {
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                // Load user invitations
                var users = [];
                for( var i = 0; i < response.company.userInvitations.length; i++ ) {
                    users.push({
                        type: 'INVI',
                        id: response.company.userInvitations[i].id,
                        icon: '<i class="far fa-envelope"></i>',
                        name: response.company.userInvitations[i].name,
                        email: response.company.userInvitations[i].emailAddress,
                        cellphone: '-',
                        status: response.company.userInvitations[i].status.name,
                        menu: '<i class="fa fa-ellipsis-v"></i>'
                    });
                }
                
                // Load users into the grid
                for( let i = 0; i < response.company.users.length; i++ ) {
                    users.push({
                        type: 'USER',
                        id: response.company.users[i].id,
                        icon: '<i class="far fa-user"></i>',
                        name: response.company.users[i].name,
                        email: response.company.users[i].emailAddress,
                        cellphone: response.company.users[i].cellNumber,
                        status: 'Active',
                        menu: '<i class="fa fa-ellipsis-v"></i>'
                    });
                }
                usersGrid.clear();
                usersGrid.addRows( users );
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
                borderWidth: '0px 0px 0px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Users'
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Invite User',
            height: '32px',
            width: '140px',
            margin: '0px 20px 0px auto',
            
            onClick: addBtnClickEventHandler
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        // Create usersGridMenuOptions array
        var usersGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create usersGrid component
        usersGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'icon', name: '', width: '30px'},
                {dataIndex: 'name', name: 'Name', minWidth: '100px', type: 'button'},
                {dataIndex: 'email', name: 'Email Address', minWidth: '100px'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: usersGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '0px', padding: '0px 5px 0px 0px'}
            ],
            
            onScrollEnd: usersGridScrollEndEventHandler,
            onCellClick: usersGridCellClickEventHandler,
            onMenuItemClick: usersGridMenuItemClickEventHandler
        });
        
        // Load departments
        loadUserGrid();
        
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
    
    function usersGridScrollEndEventHandler() {
        loadUserGrid();
    }
    
    function usersGridMenuItemClickEventHandler(event) {
        
        if (event.value === 'edit') {
            if(event.srcComponent.getRow(event.rowIndex).type === 'INVI') {
                // Create a modal window
                var editInvitationModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '500px',
                    maxHeight: '672px'
                });
                
                // Create the editInvitationPanel panel
                var editInvitationPanel = new app.panel.EditInvitation({
                    renderTo: editInvitationModal.getContainer(),
                    show: true,
                    invitationId: event.srcComponent.getRow(event.rowIndex).id,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUserGrid();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                editInvitationModal.addEventListener('destroy', function() {
                    editInvitationPanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: editInvitationModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                editInvitationModal.show();
                editInvitationPanel.focus();
            }
            else if(event.srcComponent.getRow(event.rowIndex).type === 'USER') {
                // Create a modal window
                var editUserModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '500px',
                    maxHeight: '488px'
                });
                
                // Create the editUser panel
                var editUserPanel = new app.panel.EditUser({
                    renderTo: editUserModal.getContainer(),
                    show: true,
                    userId: event.srcComponent.getRow(event.rowIndex).id,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUserGrid();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                editUserModal.addEventListener('destroy', function() {
                    editUserPanel.destroy();
                });
                
                // Create a route entry for the panel
                let state = {
                    modal: editUserModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                editUserModal.show();
                editUserPanel.focus();
            }
        }
        else if (event.value === 'remove') {
            var invitationId = event.srcComponent.getRow(event.rowIndex).id;
            if(event.srcComponent.getRow(event.rowIndex).type === 'INVI') {
                new lx.component.Messagebox({
                    title: 'Remove',
                    message: 'Are you sure you want to remove this invitation?.',
                    buttons: [
                        {name: 'no', label: 'No', style: 'text', isCancel: true},
                        {name: 'yes', label: 'Yes', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'yes' ) {
                            
                            lx.sendJSON({
                                url: 'exec.php?c=Invitation&fn=remove',
                                data: {
                                    invitationId: invitationId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Unable to remove invitation',
                                            message: response.error,
                                            icon: 'icon_error'
                                        });
                                        return;
                                    }
                                    usersGrid.clear();
                                    loadUserGrid();
                                    loader.hide();
                                }
                            });
                        }
                    }
                });
            }
            else if(event.srcComponent.getRow(event.rowIndex).type === 'USER') {
                var userId = event.srcComponent.getRow(event.rowIndex).id;
                new lx.component.Messagebox({
                    title: 'Remove',
                    message: 'Are you sure you want to remove this user from the company?.',
                    buttons: [
                        {name: 'no', label: 'No', style: 'text', isCancel: true},
                        {name: 'yes', label: 'Yes', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'yes' ) {
                            lx.sendJSON({
                                url: 'exec.php?c=Company&fn=removeUser',
                                data: {
                                    userId: userId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Unable to remove invitation',
                                            message: response.error,
                                            icon: 'icon_error'
                                        });
                                        return;
                                    }
                                    usersGrid.clear();
                                    loadUserGrid();
                                    loader.hide();
                                }
                            });
                        }
                    }
                });
            }
        }
        
    }
    
    function usersGridCellClickEventHandler(event) {
        
        // Depending on the column clicked
        if( event.columnIndex === 1 ) {
            
            if (event.record.type === 'USER') {
                // Create a modal window
                var editUserModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '500px',
                    maxHeight: '488px'
                });
                
                // Create the editUser panel
                var editUserPanel = new app.panel.EditUser({
                    renderTo: editUserModal.getContainer(),
                    show: true,
                    userId: event.record.id,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUserGrid();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                editUserModal.addEventListener('destroy', function() {
                    editUserPanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: editUserModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                editUserModal.show();
                editUserPanel.focus();
            }
            else if (event.record.type === 'INVI') {
                // Create a modal window
                var editInvitationModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '500px',
                    maxHeight: '672px'
                });
                
                // Create the editInvitationPanel panel
                var editInvitationPanel = new app.panel.EditInvitation({
                    renderTo: editInvitationModal.getContainer(),
                    show: true,
                    invitationId: event.record.id,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUserGrid();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                editInvitationModal.addEventListener('destroy', function() {
                    editInvitationPanel.destroy();
                });
                
                // Create a route entry for the panel
                let state = {
                    modal: editInvitationModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                editInvitationModal.show();
                editInvitationPanel.focus();
            }
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        var addUserModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '488px'
        });
        
        // Create the editCompanyDetails panel
        var addUserPanel = new app.panel.InviteUser({
            renderTo: addUserModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onAdd: function() {
                app.route.popState();
                loadUserGrid();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addUserModal.addEventListener('destroy', function() {
            addUserPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addUserModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addUserModal.show();
        addUserPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};