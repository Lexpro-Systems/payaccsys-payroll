/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW DEPARTMENT SETTINGS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  departmentId        The ID of the department to configure.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewDepartmentSettings = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;

    var el = null;

    var titleContainerEl = null;
    var titleBackEl = null;

    var loaderContainerEl = null;
    var tabContainerEl = null;
    var tabMarkerEl = null;
    var tabDetailsItemEl = null;
    var tabEarningsItemEl = null;
    var tabLeaveItemEl = null;
    var contentContainerEl = null;
    var loader = null;

    var detailsPanel = null;
    var earningsPanel = null;
    var leavePanel = null;
    var departmentId = null;


    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PUBLIC FUNCTIONS
    //

    me.init = function (config) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,

            departmentId: null
        };

        // Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

        // Initialize state
        confirmDestroy = false;
        departmentId = compConfig.departmentId;

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
        titleBackEl.appendChild(lx.icon.create('left_arrow', '#444D5A', 18, 1.2));
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild(titleBackEl);

        // Create the title text element
        lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Department Default Settings'
        });


        //
        // CONTENT SECTION
        //

        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
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

        // Create the tabContainerEl element
        tabContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                width: '220px',
                height: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                flex: '0 0 auto'
            }
        });

        // Create tabDetailsItemEl element
        tabDetailsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Details'
        });
        tabDetailsItemEl.addEventListener('click', tabDetailsItemElClickEventHandler);

        // Create tabEarningsItemEl element
        tabEarningsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Earnings / Deductions'
        });
        tabEarningsItemEl.addEventListener('click', tabEarningsItemElClickEventHandler);

        // Create tabLeaveItemEl element
        tabLeaveItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Leave'
        });
        tabLeaveItemEl.addEventListener('click', tabLeaveItemElClickEventHandler);

        // Create the tabMarkerEl element
        tabMarkerEl = lx.createElement('DIV', {
            parent: tabDetailsItemEl,
            style: {
                backgroundColor: '#F4F5F6',
                width: '35px',
                height: '35px',
                top: '4px',
                left: '213px',
                position: 'absolute',
                transform: 'rotate(45deg)',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
            }
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
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });


        //
        // CREATE SUB PANELS
        //

        detailsPanel = new app.panel.ViewDefaultDetails({
            renderTo: contentContainerEl,
            show: true,
            departmentId: departmentId
        });

        earningsPanel = new app.panel.ViewDepartmentDefaultEarnings({
            renderTo: contentContainerEl,
            departmentId: departmentId,
            mainPanel: me
        });

        leavePanel = new app.panel.ViewDefaultDepartmentLeave({
            renderTo: contentContainerEl,
            departmentId: departmentId
        });
        // If show is set to true show the panel.
        if (compConfig.show === true) me.show();
    };

    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function (renderTo) {
        // Remove it from its current target
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        // Add it to the new renderTo element
        renderTo.appendChild(el);
    };

    // Function to show the panel
    me.show = function () {
        lx.applyStyle(el, { display: 'flex' });
    };

    // Function to hide the panel
    me.hide = function () {
        lx.applyStyle(el, { display: 'none' });
    };

    // Function to set focus to the panel.
    me.focus = function () {
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function () {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', { srcPanel: me });

        // Remove the panel from its parent
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        return true;
    };

    me.getPanels = function () {
        let panels = null;
        panels = {
            detailsPanel: detailsPanel,
            earningsPanel: earningsPanel,
            leavePanel: leavePanel
        };

        return panels;
    };


    //
    // EVENT HANDLERS
    //

    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }

    function tabDetailsItemElClickEventHandler() {
        earningsPanel.hide();
        leavePanel.hide();
        detailsPanel.show();
        tabDetailsItemEl.appendChild(tabMarkerEl);
    }

    function tabEarningsItemElClickEventHandler() {
        detailsPanel.hide();
        leavePanel.hide();
        earningsPanel.show();
        tabEarningsItemEl.appendChild(tabMarkerEl);
    }

    function tabLeaveItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.show();
        tabLeaveItemEl.appendChild(tabMarkerEl);
    }


    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};
