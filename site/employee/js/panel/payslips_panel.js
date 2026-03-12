/* globals app, lx */
'use strict';


// PAYSLIPS PANEL
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
app.panel.Payslips = function(config) {
    
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
    var centeredContainerEl = null;
    
    var filterContainerEl = null;
    var fromYearFilterSelect = null;
    
    var payslipDetailsHeadingEl = null;
    var payslipsContainerEl = null;
    
    let payslipList = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load payslips
    function loadPayslips( clearPayslips ) {
        loader.show( false );
        
        let offset = 0;
        if( !clearPayslips ) offset = payslipList.length;
        
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getList',
            data: {
                searchString: '',
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                fromYear: fromYearFilterSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslips Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Should all payslips be cleared?
                if( clearPayslips ) {
                    payslipsContainerEl.innerHTML = '';
                    payslipList = [];
                }
                
                // Has the payslip year filter not been set?
                if( fromYearFilterSelect.getItemCount() < 1 ) {
                    // Get the payslip years
                    let fromYears = [];
                    fromYears.push({text: 'Any Year', value: null});
                    for( let i = 0; i < response.payslips.length; i++ ) {
                        let payslip = response.payslips[i];
                        
                        // Add the payslip year, if any
                        let hasYear = false;
                        for( let j = 0; j < fromYears.length; j++ ) {
                            if( fromYears[j].value === payslip.fromDate.substr( 0, 4 ) ) {
                                hasYear = true;
                                break;
                            }
                        }
                        if( !hasYear ) {
                            fromYears.push({
                                text: payslip.fromDate.substr( 0, 4 ), 
                                value: payslip.fromDate.substr( 0, 4 )
                            });
                        }
                    }
                    
                    // Set the payslip year filter
                    fromYearFilterSelect.clear();
                    fromYearFilterSelect.addItems( fromYears );
                    if( fromYears.length < 2 ) {
                        fromYearFilterSelect.setValue( fromYears[0].value, fromYears[0].text );
                    }
                    else {
                        fromYearFilterSelect.setValue( fromYears[1].value, fromYears[1].text );
                    }
                    
                    // Run this function again to display the filtered payslips
                    loadPayslips( clearPayslips );
                    return;
                }
                
                // Display a message if there aren't any requests
                if( (response.payslips.length < 1) && clearPayslips ) {
                    lx.createElement('DIV', {
                        parent: payslipsContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            padding: '15px',
                            fontSize: '14px',
                            color: 'lx.style.global.color',
                            backgroundColor: '#FFFFFF',
                            width: '100%',
                            maxWidth: '900px',
                            // minHeight: '200px',
                            flex: '1 1 100%',
                            display: 'block'
                        },
                        innerHTML: 'No payslips to display.'
                    });
                    return;
                }
                
                // Create a card for each payslip
                for( let i = 0; i < response.payslips.length; i++ ) {
                    let payslip = response.payslips[i];
                    
                    // Create a new payslip item
                    let payslipItem = {
                        id: payslip.id,
                        employeeName: payslip.alias,
                        creationTime: payslip.creationTime,
                        el: null,
                        periodEl: null,
                        employeeFullNamesEl: null,
                        nettPayLabelEl: null,
                        nettPayEl: null
                    };
                    
                    // Create the card main element
                    payslipItem.el = lx.createElement('DIV', {
                        parent: payslipsContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            margin: '1px 0px 0px 0px',
                            display: 'flex',
                            flex: '0 0 auto',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            justifyContent: 'space-between',
                            padding: '10px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: (i > 0 ? '1px 0px 0px 0px' : '0px 0px 0px 0px'),
                            borderColor: app.sectionBackgroundColor // lx.style.global.highlightColor,
                        }
                    });
                        
                    // Create the container for the payslip details
                    let payslipDetailsCointainerEl =  lx.createElement('DIV', {
                        parent: payslipItem.el,
                        style: {
                            // cursor: 'pointer',
                            display: 'flex',
                            flex: '1 1 100%',
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            fontSize: '14px',
                            margin: '0px 30px 0px 0px'
                        }
                    });
                    
                    // Create the view button
                    let viewPayslipBtnEl =  lx.createElement('DIV', {
                        parent: payslipItem.el,
                        style: {
                            cursor: 'pointer',
                            display: 'flex',
                            width: '30px',
                            minWidth: '30px',
                            height: '30px',
                            minHeight: '30px',
                            margin: 'auto 0px auto 0px',
                            fontSize: '16px',
                            color:  '#FFFFFF',
                            backgroundColor: lx.style.global.highlightColor,
                            borderRadius: '50%'
                        },
                        innerHTML: '<i class="fa fa-chevron-right" style="margin: auto auto;"></i>'
                    });
                    viewPayslipBtnEl.addEventListener('click', payslipItemElClickEventHandler.bind(this, {payslipItem: payslipItem}) );
                    
                    payslipItem.periodEl = lx.createElement('DIV', {
                        parent: payslipDetailsCointainerEl,
                        style: {
                            margin: 'auto 0px auto 0px',
                            flex: '1 1 100%',
                            maxWidth: '200px'
                            // color: '#7A7A7A',
                            // fontSize: '12px'
                        },
                        innerHTML: /*payslip.fromDate + ' to ' +  */ payslip.toDate
                    });
                    
                    // payslipItem.employeeFullNamesEl = lx.createElement('DIV', {
                    //     parent: payslipDetailsCointainerEl,
                    //     style: {
                    //         margin: 'auto 0px auto 0px',
                    //         // fontSize: 'calc(12px + 0.25vw)',
                    //         // margin: '5px 0px 0px 0px'
                    //     },
                    //     innerHTML: payslip.fullNames + ' ' + payslip.lastName
                    // });
                    
                    payslipItem.nettPayLabelEl = lx.createElement('DIV', {
                        parent: payslipDetailsCointainerEl,
                        style: {
                            margin: 'auto 0px auto 0px',
                            flex: '1 1 100%',
                            textAlign: 'right'
                            // maxWidth: '200px'
                            // fontSize: '12px',
                        },
                        innerHTML: /*'Nett Pay: ' + */ lx.util.formatCurrency(payslip.nettPay)
                    });
                    
                    // Add the item to the payslip list array
                    payslipList.push( payslipItem );
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
        
        // Clear the background color of the container to show the backgroun image
        me.getContainer().style.backgroundColor = '';
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                // backgroundColor: app.panelBackgroundColor
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
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
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
            innerHTML: '<i class="fa fa-fw fa-scroll" style="margin: 0px 15px 0px 0px;"></i>Payslips'
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
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the centeredContainerEl component
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '768px',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                margin: '0px auto',
                overflow: 'hidden'
            }
        });
        
        
        //
        // PAYSLIP SECTION
        //
        
        // Create the container for the entire heading row
        let payslipsHeadingContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '768px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Display the heading
        let payslipsHeadingEl = lx.createElement('DIV', {
            parent: payslipsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Payslips For Period</div>'
        });
        
        // Create the filterContainerEl component
        filterContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'left',
                width: '100%',
                padding: '5px 10px',
                backgroundColor: app.filterBackgroundColor,
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: ('0px ' + app.sectionBorderWidth)
            }
        });
        
        // Create the fromYearFilterSelect component
        fromYearFilterSelect = new lx.component.Selectbox({
            renderTo: filterContainerEl,
            label: 'Period:',
            labelAlign: 'left',
            labelWidth: '60px',
            maxWidth: '300px',
            search: false,
            
            onChange: filterOnChangeEventHandler
        });
        
        // // Create an edit button
        // let editPersonalDetailsBtnEl = lx.createElement('DIV', {
        //     parent: payslipsHeadingContainerEl,
        //     style: {
        //         cursor: 'pointer',
        //         display: 'flex',
        //         width: '28px',
        //         minWidth: '28px',
        //         height: '28px',
        //         minHeight: '28px',
        //         margin: 'auto 15px auto auto',
        //         fontSize: '14px',
        //         color: lx.style.global.backgroundColor,
        //         backgroundColor: lx.style.global.highlightColor,
        //         borderRadius: '50%'
        //     },
        //     innerHTML: '<i class="fa fa-pen" style="margin: auto auto;"></i>'
        // });
        // editPersonalDetailsBtnEl.addEventListener('click', editPersonalDetailsBtnElClickEventHandler);
        
        // Create a section to display the details
        payslipsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '5px 10px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        
        // // Create the payslipDetailsHeadingEl element
        // payslipDetailsHeadingEl = lx.createElement('DIV', {
        //     parent: centeredContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         width: '100%',
        //         margin: '0px 0px 0px 0px',
        //         padding: '15px',
        //         fontSize: '16px',
        //         color: '#FFFFFF',
        //         backgroundColor: app.sectionBackgroundColor
        //     },
        //     innerHTML: '<div>Payslips For Period</div>'
        // });
        
        
        // //
        // // FILTERS SECTION
        // //
        
        
        
        // // Create the payslipsContainerEl component
        // payslipsContainerEl = lx.createElement('DIV', {
        //     parent: centeredContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'column',
        //         alignItems: 'center',
        //         width: '100%',
        //         backgroundColor: app.filterBackgroundColor, // app.sectionBackgroundColor,
        //         padding: '0px 1px 1px 1px',
        //         overflow: 'auto'
        //     }
        // });
        
        // Load the available payslips
        loadPayslips( true );
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
        
        me.panelDestroy();
        
        return true;
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        fromYearFilterSelect.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Filter change event handler
    function filterOnChangeEventHandler() {
        loader.show( true );
        loadPayslips(true);
    }
    
    // payslipItemEl click event handler
    function payslipItemElClickEventHandler( event ) {
        // Make sure payslipId is not null or undefined
        if( typeof event.payslipItem.id === 'undefined' || event.payslipItem.id === null ) return;
        
        me.hide();
        
        let viewPayslipPanel = new app.panel.ViewPayslip({
            renderTo: app.mainPanel.getPanelContainer(),
            payslipId: event.payslipItem.id,
            employeeName: event.payslipItem.employeeName
        });
        
        let panelState = {
            previousPanel: me,
            panel: viewPayslipPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
        
        viewPayslipPanel.show();
        viewPayslipPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};