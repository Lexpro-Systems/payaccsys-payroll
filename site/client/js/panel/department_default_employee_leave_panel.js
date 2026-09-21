/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW DEPARTMENT LEAVE RULES PANEL
//
// Config:
//  renderTo:       The parent DOM object.
//  width:          Panel width.
//  height:         Panel height.
//  flex:           CSS flex property.
//  show:           Show the panel immediately when true.
//  departmentId:   The ID of the department being configured.
//
app.panel.ViewDefaultDepartmentLeave = function (config) {
    var me = this;
    var el = null;
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;

    lx.EventEmitter.call(this);

    function loadLeaveTypes() {
        loader.show(false);
        contentContainerEl.innerHTML = '';

        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            onSuccess: function (jsonResult) {
                loader.hide();
                var result = JSON.parse(jsonResult);

                if (result.ok !== true) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave rules.'
                    });
                    return;
                }

                for (let i = 0; i < result.leaveTypes.length; i++) {
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            margin: '20px 0px 0px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF'
                        }
                    });

                    lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            padding: '0px 15px',
                            height: '45px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 1px 0px',
                            borderColor: '#DFDFDF'
                        },
                        innerHTML: result.leaveTypes[i].name
                    });

                    // Create an item for each rule
                    for (let j = 0; j < result.leaveTypes[i].rules.length; j++) {
                        let rule = result.leaveTypes[i].rules[j];
                        let ruleText = '';

                        // Convert leave to string
                        if (rule.accrualType.code === 'HWOR') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval +
                                ' hours worked.';
                        }
                        else if (rule.accrualType.code === 'DWOR') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval +
                                ' days worked.';
                        }
                        else if (rule.accrualType.code === 'PAYS') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave for every ' + rule.accrualInterval +
                                ' payslips received.';
                        }
                        else if (rule.accrualType.code === 'PPES') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' +
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if (rule.accrualType.code === 'PPEE') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' +
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if (rule.accrualType.code === 'DCST') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() +
                                ' of leave at the beginning of every ' + rule.accrualInterval + ' day cycle.';
                        }
                        else if (rule.accrualType.code === 'DCEN') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' +
                                rule.accrualInterval + ' day cycle.';
                        }
                        else if (rule.accrualType.code === 'MCST') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' +
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if (rule.accrualType.code === 'MCEN') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' +
                                rule.accrualInterval + ' month cycle.';
                        }
                        else if (rule.accrualType.code === 'YCST') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the beginning of every ' +
                                rule.accrualInterval + ' year cycle.';
                        }
                        else if (rule.accrualType.code === 'YCEN') {
                            ruleText = ruleText + 'From month ' + rule.startMonth + ' earn ' + lx.util.formatLeaveUnits(rule.amount, null) +
                                ' ' + result.leaveTypes[i].leaveUnitCode.toLowerCase() + ' of leave at the end of every ' +
                                rule.accrualInterval + ' year cycle.';
                        }

                        lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'

                            },
                            innerHTML: ruleText
                        });
                    }

                    let ruleText = '';
                    if (result.leaveTypes[i].rules.length === 0) {
                        ruleText = 'This type does not have any rules.';

                        lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                width: '100%',
                                padding: '10px 15px'

                            },
                            innerHTML: ruleText
                        });
                    }

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

    me.init(config);
};