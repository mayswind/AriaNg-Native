'use strict';

const os = require('os');
const electron = require('electron');

const core = require('../core');
const ipcRender = require('../ipc/render-proecss');

const app = electron.app;
const Menu = electron.Menu;

let getMenuTitle = function(context, titleKey, defaultTitle) {
    if (!context || !context.labels || !context.labels[titleKey]) {
        return defaultTitle;
    }

    return context.labels[titleKey];
}

let buildMenu = function(context) {
    return Menu.buildFromTemplate([
        {
            label: app.getName(),
            submenu: [
                {
                    label: getMenuTitle(context, 'AboutAriaNgNative', 'About AriaNg Native'),
                    click: function () {
                        ipcRender.notifyRenderProcessNavigateToAriaNgSettings();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: getMenuTitle(context, 'Services', 'Services'),
                    role: 'services'
                },
                {
                    label: getMenuTitle(context, 'HideAriaNgNative', 'Hide AriaNg Native'),
                    role: 'hide'
                },
                {
                    label: getMenuTitle(context, 'HideOthers', 'Hide Others'),
                    role: 'hideothers'
                },
                {
                    label: getMenuTitle(context, 'ShowAll', 'Show All'),
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    label: getMenuTitle(context, 'QuitAriaNgNative', 'Quit AriaNg Native'),
                    role: 'quit',
                    click: function () {
                        core.isConfirmExit = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: getMenuTitle(context, 'Edit', 'Edit'),
            submenu: [
                {
                    label: getMenuTitle(context, 'Undo', 'Undo'),
                    role: 'undo'
                },
                {
                    label: getMenuTitle(context, 'Redo', 'Redo'),
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: getMenuTitle(context, 'Cut', 'Cut'),
                    role: 'cut'
                },
                {
                    label: getMenuTitle(context, 'Copy', 'Copy'),
                    role: 'copy'
                },
                {
                    label: getMenuTitle(context, 'Paste', 'Paste'),
                    role: 'paste'
                },
                {
                    label: getMenuTitle(context, 'Delete', 'Delete'),
                    role: 'delete'
                },
                {
                    label: getMenuTitle(context, 'SelectAll', 'Select All'),
                    role: 'selectAll'
                }
            ]
        },
        {
            label: getMenuTitle(context, 'Window', 'Window'),
            submenu: [
                {
                    label: getMenuTitle(context, 'Minimize', 'Minimize'),
                    role: 'minimize'
                },
                {
                    label: getMenuTitle(context, 'Zoom', 'Zoom'),
                    role: 'zoom'
                },
                {
                    type: 'separator'
                },
                {
                    label: getMenuTitle(context, 'BringAllToFront', 'Bring All to Front'),
                    role: 'front'
                }
            ]
        }
    ]);
}

let init = function () {
    if (!core.mainWindow) {
        return;
    }

    if (os.platform() === 'darwin') {
        const menu = buildMenu(null);
        Menu.setApplicationMenu(menu);
    } else {
        core.mainWindow.setMenu(null);
    }
}

let setApplicationMenu = function (context) {
    if (core.mainWindow && os.platform() === 'darwin') {
        const menu = buildMenu(context);
        Menu.setApplicationMenu(menu);
    }
};

module.exports = {
    init: init,
    setApplicationMenu: setApplicationMenu
};
