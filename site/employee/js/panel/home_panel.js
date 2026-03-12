/* jslint node: true */
/* globals app, lx */
'use strict';


// HOME PANEL
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
app.panel.Home = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var centeredContainerEl = null
    
    var headingSectionEl = null;
    var employeeNameEl = null;
    var companyNameEl = null;
    
    var buttonBarEl = null;
    var profileButtonEl = null;
    var profileButtonSectionEl = null;
    var profileButtonBackgroundEl = null;
    var profileButtonContentEl = null;
    var profileButtonlabelEl = null;
    var logoutButtonEl = null;
    var logoutButtonSectionEl = null;
    var logoutButtonBackgroundEl = null;
    var logoutButtonContentEl = null;
    var logoutButtonlabelEl = null;
    
    var payslipDetailsContainerEl = null;
    var payslipDetailsHeadingEl = null;
    var payslipDetailsSectionEl = null;
    var payslipsContainerEl = null;
    
    let payslipList = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load profile and payslips
    function loadProfile( clearPayslips ) {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getProfile',
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Profile Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Set the user details
                employeeNameEl.innerHTML = response.profile.firstName + ' ' + response.profile.lastName;
                
                // Get the logged in company
                let companyName = '-';
                
                for(let i = 0; i < response.profile.companies.length; i++ ) {
                    if( response.profile.companies[i].isLoggedIn == true ) {
                        companyName = response.profile.companies[i].name;
                    }
                }
                companyNameEl.innerHTML = 'Company: ' + companyName;
                
                let offset = 0;
                if( !clearPayslips ) offset = payslipList.length;
                
                lx.sendJSON({
                    url: 'exec.php?c=Payslip&fn=getList',
                    data: {
                        searchString: '',
                        limit: 6,
                        offset: offset,
                        sortOrder: 'DESC'
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
                                    display: 'block'
                                },
                                innerHTML: 'No payslips to display'
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
                                innerHTML: /*payslip.fromDate + ' to ' + */ payslip.toDate
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
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            payslipId: null
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
        
        // Create the title container element
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
                borderColor: app.panelBackgroundColor,
                borderWidth: '0px 0px 1px 0px',
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
            innerHTML: '<i class="fa fa-fw fa-home" style="margin: 0px 15px 0px 0px;"></i>Home'
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
                padding: '0px 0px 0px 0px',
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
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                maxWidth: '768px'
            }
        });
        
        
        //
        // HEADING SECTION
        //
        
        // Create headingSectionEl
        headingSectionEl = app.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '15px 0px 0px 0px',
                padding: '20px 0px',
                width: '100%',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                maxWidth: '768px',
                borderRadius: app.sectionBorderRadius
            }
        });
        
        // Create employeeNameEl element
        employeeNameEl = app.createElement('DIV', {
            parent: headingSectionEl,
            style: {
                fontSize: '32px',
                textAlign: 'center',
                margin: '0px 0px 0px 0px'
            },
            innerHTML: '-'
        });
        
        // Create nettPayEl element
        companyNameEl = app.createElement('DIV', {
            parent: headingSectionEl,
            style: {
                fontSize: '16px',
                margin: '5px 0px 0px 0px',
                textAlign: 'center',
                color: app.filterBackgroundColor
            },
            innerHTML: '-'
        });
        
        // Create the buttonBarEl component
        buttonBarEl = lx.createElement('DIV', {
            parent: headingSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                position: 'relative',
                boxSizing: 'border-box',
                margin: '16px auto 0px auto',
                flex: '0 0 auto',
                border: 'none',
                width: '100%',
                maxWidth: '800px',
                justifyContent: 'space-evenly'
            }
        });
        
        // Create the profileButtonEl component
        profileButtonEl = lx.createElement('DIV', {
            parent: buttonBarEl,
            style: {
                width: '150px',
                tranform: 'scale(0, 0)'
            }
        });
        
        // Create the profileButtonSectionEl component
        profileButtonSectionEl = lx.createElement('DIV', {
            parent: profileButtonEl,
            style: {
                width: '45px',
                height: '45px',
                margin: '0px auto',
                position: 'relative'
            }
        });
        
        // Create the profileButtonBackgroundEl component
        profileButtonBackgroundEl = lx.createElement('DIV', {
            parent: profileButtonSectionEl,
            style: {
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: lx.style.global.highlightColor,
                position: 'absolute'
            }
        });
        
        // Create the profileButtonContentEl component
        profileButtonContentEl = lx.createElement('DIV', {
            parent: profileButtonSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                cursor: 'pointer',
                position: 'absolute',
                width: '100%',
                height: '100%',
                color: '#FFFFFF',
                transition: 'opacity 0.25s 0.0s ease-in'
            },
            innerHTML: '<i class="fa fa-user" style="font-size: 20px;"></i>'
        });
        profileButtonContentEl.addEventListener('click', profileBtnClickEventHandler);
        
        // Create the profileButtonlabelEl component
        profileButtonlabelEl = lx.createElement('DIV', {
            parent: profileButtonEl,
            style: {
                fontSize: '12px',
                textAlign: 'center',
                margin: '8px 0px 0px 0px',
                color: app.filterBackgroundColor
            },
            innerHTML: 'Profile'
        });
        
        // Create the logoutButtonEl component
        logoutButtonEl = lx.createElement('DIV', {
            parent: buttonBarEl,
            style: {
                width: '150px',
                tranform: 'scale(0, 0)'
            }
        });
        
        // Create the logoutButtonSectionEl component
        logoutButtonSectionEl = lx.createElement('DIV', {
            parent: logoutButtonEl,
            style: {
                width: '45px',
                height: '45px',
                margin: '0px auto',
                position: 'relative'
            }
        });
        
        // Create the logoutButtonBackgroundEl component
        logoutButtonBackgroundEl = lx.createElement('DIV', {
            parent: logoutButtonSectionEl,
            style: {
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: lx.style.global.highlightColor,
                position: 'absolute'
            }
        });
        
        // Create the logoutButtonContentEl component
        logoutButtonContentEl = lx.createElement('DIV', {
            parent: logoutButtonSectionEl,
            className: 'component-flex-row component-flex-align-center component-flex-justify-center',
            style: {
                cursor: 'pointer',
                position: 'absolute',
                width: '100%',
                height: '100%',
                color: '#FFFFFF',
                transition: 'opacity 0.25s 0.0s ease-in'
            },
            innerHTML: '<i class="fa fa-power-off" style="font-size: 20px;"></i>'
        });
        logoutButtonContentEl.addEventListener('click', logoutBtnClickEventHandler);
        
        // Create the logoutButtonlabelEl component
        logoutButtonlabelEl = lx.createElement('DIV', {
            parent: logoutButtonEl,
            style: {
                fontSize: '12px',
                textAlign: 'center',
                margin: '8px 0px 0px 0px',
                color: app.filterBackgroundColor
            },
            innerHTML: 'Logout'
        });
        
        
        //
        // PAYSLIPS SECTION
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
            innerHTML: '<div>Last Six Payslips</div>'
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
        
        // Load form data
        loader.show(false);
        
        // Load the available payslips
        loadProfile( true );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // profileBtn click event handler
    function profileBtnClickEventHandler() {
        me.hide();
        
        let profilePanel = new app.panel.Profile({
            renderTo: app.mainPanel.getPanelContainer(),
            
            onSave: function() {
                loadProfile( true );
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: profilePanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
        
        profilePanel.show();
        profilePanel.focus();
    }
    
    // logoutBtn click event handler
    function logoutBtnClickEventHandler() {
        app.logout();
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