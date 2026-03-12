/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST PUBLIC HOLIDAYS PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ListPublicHolidays = function(config) {
    
    
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
    
    var holidaysGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load public holidays
    function loadPublicHolidays() {
        lx.sendJSON({
            url: 'exec.php?c=Holiday&fn=getList',
            data: {
                searchString: '', // searchTxt.getValue().trim(),
                limit: 50,
                offset: holidaysGrid.getRowCount(),
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Public Holidays Failed',
                        message: response.error
                    });
                }
                
                let holidays = [];
                for( let i = 0; i < response.holidays.length; i++ ) {
                    holidays.push({
                        id: response.holidays[i].id,
                        date: response.holidays[i].date,
                        description: response.holidays[i].name,
                        addedOn: response.holidays[i].addedOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                holidaysGrid.addRows( holidays );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
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
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                overflow: '',
                backgroundColor: '#F4F5F6',
                height: '100%'
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
            innerHTML: 'Public Holidays'
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add',
            height: '32px',
            width: '120px',
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
                overflow: 'auto',
                // padding: '15px 15px 15px 15px'
            }
        });
        
        // Create holidaysGridMenuOptions array
        var holidaysGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create holidaysGrid component
        holidaysGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            // maxWidth: '900px',
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'date', name: 'Date', width: '120px', type: 'button'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'addedOn', name: 'Added On', width: '120px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: holidaysGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '0px', padding: '0px 5px 0px 0px'}
            ],
            
            onScrollEnd: holidaysGridScrollEndEventHandler,
            onCellClick: holidaysGridCellClickEventHandler,
            onMenuItemClick: holidaysGridMenuItemClickEventHandler
        });
        
        // Load departments
        loadPublicHolidays();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // holidaysGridScrollEnd event handler
    function holidaysGridScrollEndEventHandler() {
        loadPublicHolidays();
    }
    
    // holidaysGridMenuItem click event handler
    function holidaysGridMenuItemClickEventHandler(clickEvent) {
        // Depending on the menu item selected
        if (clickEvent.value === 'edit') {
            // Create the editHolidayPanel panel
            let editHolidayPanel = new app.panel.EditPublicHoliday({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '297px',
                
                holidayId: holidaysGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    holidaysGrid.clear();
                    loadPublicHolidays();
                }
            });
            
            // Create a route entry for the panel
            let state = {
                panel: editHolidayPanel
            };
            app.route.pushState(state, function( state ) {
                state.panel.destroy();
            });
            
            // Show the modal window and focus on the panel
            editHolidayPanel.showModal();
            editHolidayPanel.focus();
        }
        else if (clickEvent.value === 'remove') {
            new lx.component.Messagebox({
                title: 'Remove',
                message: 'Are you sure you want to remove this public holiday?.',
                buttons: [
                    {name: 'no', label: 'No', style: 'text', isCancel: true},
                    {name: 'yes', label: 'Yes', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'yes' ) {
                        
                        lx.sendJSON({
                            url: 'exec.php?c=Holiday&fn=remove',
                            data: {
                                holidayId: holidaysGrid.getRow(clickEvent.rowIndex).id,
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse( responseText );
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Unable to remove public holiday',
                                        message: response.error,
                                        icon: 'icon_error'
                                    });
                                    return;
                                }
                                holidaysGrid.clear();
                                loadPublicHolidays();
                            }
                        });
                    }
                }
            });
        }
    }
    
    // holidaysGrid cell click event handler
    function holidaysGridCellClickEventHandler(clickEvent) {
        // Depending on the column clicked
        if( holidaysGrid.getColumnDataIndex(clickEvent.columnIndex) === 'date' ) {
            // Create the editHolidayPanel panel
            let editHolidayPanel = new app.panel.EditPublicHoliday({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '297px',
                
                holidayId: holidaysGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    holidaysGrid.clear();
                    loadPublicHolidays();
                }
            });
            
            // Create a route entry for the panel
            let state = {
                panel: editHolidayPanel
            };
            app.route.pushState(state, function( state ) {
                state.panel.destroy();
            });
            
            // Show the modal window and focus on the panel
            editHolidayPanel.showModal();
            editHolidayPanel.focus();
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        // Create the addHolidayPanel panel
        let addPublicHolidayPanel = new app.panel.AddPublicHoliday({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '297px',
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                holidaysGrid.clear();
                loadPublicHolidays();
            }
        });
        
        // Create a route entry for the panel
        let state = {
            panel: addPublicHolidayPanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Show the modal window and focus on the panel
        addPublicHolidayPanel.showModal();
        addPublicHolidayPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};