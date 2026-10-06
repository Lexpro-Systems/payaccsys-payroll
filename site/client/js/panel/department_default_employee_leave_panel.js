/* jslint node: true */
/* globals app, lx */
'use strict';

app.panel.ViewDefaultDepartmentLeave = function (config) {
    var me = this;
    var el = null;
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var leaveTypes = [];

    lx.EventEmitter.call(this);

    function createLeaveTypeHeader(leaveType, typeContainerEl, leaveTypeIndex) {
        let typeHeadingEl = lx.createElement('DIV', {
            parent: typeContainerEl,
            style: {
                padding: '0px 15px',
                height: '45px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            }
        });

        let leaveHeadingContainerEl = lx.createElement('DIV', {
            parent: typeHeadingEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            }
        });

        let subscribeCheckbox = new lx.component.Checkbox({
            renderTo: leaveHeadingContainerEl,
            label: null,
            margin: '0px 10px 0px 0px',
            width: ''
        });
        subscribeCheckbox.addEventListener('click', subscribeCheckboxChangeEventHandler.bind(me, leaveType.id));
        subscribeCheckbox.setValue(leaveType.isSubscribed !== false);

        lx.createElement('DIV', {
            parent: leaveHeadingContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            },
            innerHTML: leaveType.name
        });

        leaveTypes[leaveTypeIndex] = {
            leaveTypeId: leaveType.id,
            name: leaveType.name,
            subscribeCheckboxEl: subscribeCheckbox,
            typeContainerEl: typeContainerEl
        };
    }

    function reloadLeaveType(leaveTypeId) {
        let currentLeaveTypeIndex = null;
        for (var i = 0; i < leaveTypes.length; i++) {
            if (leaveTypes[i].leaveTypeId === leaveTypeId) {
                currentLeaveTypeIndex = i;
                break;
            }
        }

        if (currentLeaveTypeIndex === null) return;

        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getLeaveTypeList',
            data: {
                departmentId: config.departmentId
            },
            onSuccess: function (jsonResult) {
                var result = JSON.parse(jsonResult);

                if (result.ok !== true) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    return;
                }

                for (let i = 0; i < result.leaveTypes.length; i++) {
                    if (result.leaveTypes[i].id === leaveTypeId) {
                        let typeContainerEl = leaveTypes[currentLeaveTypeIndex].typeContainerEl;
                        typeContainerEl.innerHTML = '';
                        createLeaveTypeHeader(result.leaveTypes[i], typeContainerEl, currentLeaveTypeIndex);
                        break;
                    }
                }
            }
        });
    }

    function loadLeaveTypes() {
        leaveTypes = [];

        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getLeaveTypeList',
            data: {
                departmentId: config.departmentId
            },
            onSuccess: function (jsonResult) {
                var result = JSON.parse(jsonResult);

                if (result.ok !== true) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    return;
                }

                for (let i = 0; i < result.leaveTypes.length; i++) {
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            minWidth: '532px',
                            margin: '20px 0px 0px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF'
                        }
                    });

                    createLeaveTypeHeader(result.leaveTypes[i], typeContainerEl, i);
                }
            }
        });
    }

    me.init = function (config) {
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,
            departmentId: null
        };

        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

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

        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'hidden'
            }
        });

        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });

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

        loadLeaveTypes();
        if (compConfig.show === true) me.show();
    };

    me.setRenderTarget = function (renderTo) {
        if (el.parentElement !== null) el.parentElement.removeChild(el);
        renderTo.appendChild(el);
    };

    me.show = function () {
        lx.applyStyle(el, { display: 'flex' });
    };

    me.hide = function () {
        lx.applyStyle(el, { display: 'none' });
    };

    me.focus = function () {
    };

    me.destroy = function () {
        me.fireEvent('destroy', null);
        if (el.parentElement !== null) el.parentElement.removeChild(el);
        return true;
    };

    function subscribeCheckboxChangeEventHandler(leaveTypeId) {
        let leaveType = null;
        for (var i = 0; i < leaveTypes.length; i++) {
            if (leaveTypes[i].leaveTypeId === leaveTypeId) {
                leaveType = leaveTypes[i];
                break;
            }
        }

        if (leaveType === null) {
            new lx.component.Messagebox({
                message: 'Failed to update the department leave type.'
            });
            return;
        }

        lx.sendJSON({
            url: 'exec.php?c=Department&fn=subscribeLeave',
            data: {
                leaveTypeId: leaveTypeId,
                departmentId: config.departmentId,
                unsubscribe: leaveType.subscribeCheckboxEl.getValue()
            },
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Department leave',
                        message: response.error
                    });
                }
                reloadLeaveType(leaveTypeId);
            }
        });
    }

    me.init(config);
};
